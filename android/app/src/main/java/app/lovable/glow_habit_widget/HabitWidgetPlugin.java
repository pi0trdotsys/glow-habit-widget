package app.lovable.glow_habit_widget;

import android.appwidget.AppWidgetManager;
import android.content.ComponentName;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/** Lets the web app force an immediate widget refresh after data changes. */
@CapacitorPlugin(name = "HabitWidget")
public class HabitWidgetPlugin extends Plugin {
    @PluginMethod
    public void refresh(PluginCall call) {
        AppWidgetManager mgr = AppWidgetManager.getInstance(getContext());
        int[] ids = mgr.getAppWidgetIds(
            new ComponentName(getContext(), HabitWidgetProvider.class));
        for (int id : ids) {
            HabitWidgetProvider.updateWidget(getContext(), mgr, id);
        }
        call.resolve();
    }
}
