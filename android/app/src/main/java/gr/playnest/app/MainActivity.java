package gr.playnest.app;

import android.content.SharedPreferences;
import android.os.Bundle;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    private static final String PREFS = "playnest";
    private static final String MIGRATED = "legacy_migrated";
    private WebView legacyReader;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(LegacyDataPlugin.class);
        super.onCreate(savedInstanceState);
        SharedPreferences prefs = getSharedPreferences(PREFS, MODE_PRIVATE);
        if (prefs.getBoolean(MIGRATED, false)) LegacyDataPlugin.finish("{}");
        else readLegacyData(prefs);
    }

    /**
     * PlayNest 1.x kept its data in the WebView's localStorage for file:// pages. The new app runs at
     * https://localhost and can't see it, so a hidden WebView opened at file:// reads it once and passes
     * it on through LegacyDataPlugin; the app imports it only if nothing was saved in the new version yet.
     */
    private void readLegacyData(SharedPreferences prefs) {
        legacyReader = new WebView(this);
        legacyReader.getSettings().setJavaScriptEnabled(true);
        legacyReader.getSettings().setDomStorageEnabled(true);
        legacyReader.getSettings().setAllowFileAccess(true);
        legacyReader.addJavascriptInterface(new Object() {
            @JavascriptInterface
            public void done(String json) {
                prefs.edit().putBoolean(MIGRATED, true).apply();
                LegacyDataPlugin.finish(json);
                runOnUiThread(() -> {
                    if (legacyReader != null) {
                        legacyReader.destroy();
                        legacyReader = null;
                    }
                });
            }
        }, "PlayNestLegacy");
        legacyReader.loadUrl("file:///android_asset/legacy-export.html");
    }
}
