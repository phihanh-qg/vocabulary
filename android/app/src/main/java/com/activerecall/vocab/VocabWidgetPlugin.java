package com.activerecall.vocab;

import android.Manifest;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;

import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "VocabWidget")
public class VocabWidgetPlugin extends Plugin {

    @PluginMethod
    public void syncWords(PluginCall call) {
        String wordsJson = call.getString("wordsJson", "[]");
        Context ctx = getContext();
        VocabPrefsHelper.saveWordsJson(ctx, wordsJson);
        VocabWidgetProvider.refreshAllWidgets(ctx);
        if (VocabPrefsHelper.isLockScreenEnabled(ctx)) {
            LockScreenService.updateNotification(ctx);
        }
        call.resolve();
    }

    @PluginMethod
    public void setLockScreenConfig(PluginCall call) {
        boolean enabled = Boolean.TRUE.equals(call.getBoolean("enabled", false));
        boolean autoPopup = Boolean.TRUE.equals(call.getBoolean("autoPopup", false));
        Context ctx = getContext();

        if (enabled && Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (ContextCompat.checkSelfPermission(ctx, Manifest.permission.POST_NOTIFICATIONS)
                != PackageManager.PERMISSION_GRANTED) {
                ActivityCompat.requestPermissions(
                    getActivity(),
                    new String[]{Manifest.permission.POST_NOTIFICATIONS},
                    9001
                );
            }
        }

        VocabPrefsHelper.setLockScreenConfig(ctx, enabled, autoPopup);
        if (enabled) {
            LockScreenService.start(ctx);
        } else {
            LockScreenService.stop(ctx);
        }
        call.resolve();
    }

    @PluginMethod
    public void getLockScreenConfig(PluginCall call) {
        Context ctx = getContext();
        boolean canDraw = Build.VERSION.SDK_INT < Build.VERSION_CODES.M || Settings.canDrawOverlays(ctx);
        JSObject ret = new JSObject();
        ret.put("enabled", VocabPrefsHelper.isLockScreenEnabled(ctx));
        ret.put("autoPopup", VocabPrefsHelper.isAutoPopupOnUnlock(ctx));
        ret.put("canDrawOverlays", canDraw);
        call.resolve(ret);
    }

    @PluginMethod
    public void requestOverlayPermission(PluginCall call) {
        Context ctx = getContext();
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M && !Settings.canDrawOverlays(ctx)) {
            Intent intent = new Intent(
                Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                Uri.parse("package:" + ctx.getPackageName())
            );
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            ctx.startActivity(intent);
        }
        call.resolve();
    }

    @PluginMethod
    public void popPendingReviews(PluginCall call) {
        String reviewsJson = VocabPrefsHelper.popPendingReviewsJson(getContext());
        JSObject ret = new JSObject();
        ret.put("reviewsJson", reviewsJson);
        call.resolve(ret);
    }

    @PluginMethod
    public void openQuickRecall(PluginCall call) {
        Intent intent = new Intent(getContext(), QuickRecallActivity.class);
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        getContext().startActivity(intent);
        call.resolve();
    }
}
