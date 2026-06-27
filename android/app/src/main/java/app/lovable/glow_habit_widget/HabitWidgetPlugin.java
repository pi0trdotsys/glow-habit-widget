package app.lovable.glow_habit_widget;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/** Lets the web app force an immediate refresh of both widgets after data changes. */
@CapacitorPlugin(name = "HabitWidget")
public class HabitWidgetPlugin extends Plugin {
    @PluginMethod
    public void refresh(PluginCall call) {
        WidgetShared.updateAll(getContext());
        call.resolve();
    }
}
