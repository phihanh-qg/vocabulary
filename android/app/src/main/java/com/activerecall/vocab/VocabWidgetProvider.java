package com.activerecall.vocab;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.widget.RemoteViews;

public class VocabWidgetProvider extends AppWidgetProvider {
    public static final String ACTION_NEXT_WORD = "com.activerecall.vocab.ACTION_WIDGET_NEXT_WORD";

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        for (int appWidgetId : appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId);
        }
    }

    @Override
    public void onReceive(Context context, Intent intent) {
        super.onReceive(context, intent);
        if (ACTION_NEXT_WORD.equals(intent.getAction())) {
            VocabPrefsHelper.advanceWord(context);
            refreshAllWidgets(context);
            if (VocabPrefsHelper.isLockScreenEnabled(context)) {
                LockScreenService.updateNotification(context);
            }
        }
    }

    public static void refreshAllWidgets(Context context) {
        AppWidgetManager manager = AppWidgetManager.getInstance(context);
        int[] ids = manager.getAppWidgetIds(new ComponentName(context, VocabWidgetProvider.class));
        for (int id : ids) {
            updateAppWidget(context, manager, id);
        }
    }

    static void updateAppWidget(Context context, AppWidgetManager appWidgetManager, int appWidgetId) {
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_vocab);
        VocabPrefsHelper.WordEntry entry = VocabPrefsHelper.getCurrentWord(context);

        if (entry != null && !entry.word.isEmpty()) {
            views.setTextViewText(R.id.widget_word, entry.word);
            views.setTextViewText(R.id.widget_pos, entry.partOfSpeech.isEmpty() ? "vocab" : entry.partOfSpeech);
            views.setTextViewText(R.id.widget_ipa, entry.pronunciation.isEmpty() ? "Chạm để kiểm tra nghĩa" : entry.pronunciation);
        } else {
            views.setTextViewText(R.id.widget_word, "ActiveRecall");
            views.setTextViewText(R.id.widget_pos, "sync");
            views.setTextViewText(R.id.widget_ipa, "Mở app để nạp danh sách từ vựng");
        }

        // Check button -> opens QuickRecallActivity
        Intent checkIntent = new Intent(context, QuickRecallActivity.class);
        checkIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent checkPending = PendingIntent.getActivity(
            context,
            101,
            checkIntent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
        views.setOnClickPendingIntent(R.id.widget_btn_check, checkPending);
        views.setOnClickPendingIntent(R.id.widget_root, checkPending);

        // Next button -> cycles word
        Intent nextIntent = new Intent(context, VocabWidgetProvider.class);
        nextIntent.setAction(ACTION_NEXT_WORD);
        PendingIntent nextPending = PendingIntent.getBroadcast(
            context,
            102,
            nextIntent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
        views.setOnClickPendingIntent(R.id.widget_btn_next, nextPending);

        appWidgetManager.updateAppWidget(appWidgetId, views);
    }
}
