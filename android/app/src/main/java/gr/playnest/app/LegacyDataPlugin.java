package gr.playnest.app;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.util.ArrayList;
import java.util.List;

/** Hands PlayNest 1.x data (read by MainActivity) to the web app. `get()` waits until the read is done. */
@CapacitorPlugin(name = "LegacyData")
public class LegacyDataPlugin extends Plugin {

    private static String result; // JSON object as text, "{}" when there was nothing to import
    private static final List<PluginCall> waiting = new ArrayList<>();

    static synchronized void finish(String json) {
        result = json == null ? "{}" : json;
        for (PluginCall call : waiting) resolve(call);
        waiting.clear();
    }

    private static void resolve(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("json", result);
        call.resolve(ret);
    }

    @PluginMethod
    public void get(PluginCall call) {
        synchronized (LegacyDataPlugin.class) {
            if (result != null) resolve(call);
            else {
                call.setKeepAlive(true);
                waiting.add(call);
            }
        }
    }
}
