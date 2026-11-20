package com.activerecall.vocab;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.pm.ServiceInfo;
import android.os.Build;
import android.os.IBinder;
import android.provider.Settings;

import androidx.core.app.NotificationCompat;

public class LockScreenService extends Service {
    private static final String CHANNEL_ID = "activerecall_lockscreen_channel";
    private static final int NOTIFICATION_ID = 7701;
    public static final String ACTION_NEXT = "com.activerecall.vocab.LOCKSCREEN_NEXT";

    private BroadcastReceiver unlockReceiver;

    @Override
    public void onCreate() {
        super.onCreate();
        createNotificationChannel();

        unlockReceiver = new BroadcastReceiver() {
            @Override
            public void onReceive(Context context, Intent intent) {
                String action = intent.getAction();
                if (Intent.ACTION_SCREEN_ON.equals(action) || Intent.ACTION_USER_PRESENT.equals(action)) {
                    if (Intent.ACTION_SCREEN_ON.equals(action)) {
                        // Advance to a fresh word when waking up the lock screen
                        VocabPrefsHelper.advanceWord(context);
                        VocabWidgetProvider.refreshAllWidgets(context);
                        updateNotification(context);
                    }

                    if (VocabPrefsHelper.isAutoPopupOnUnlock(context)) {
                        boolean canDraw = Build.VERSION.SDK_INT < Build.VERSION_CODES.M || Settings.canDrawOverlays(context);
                        if (canDraw) {
                            Intent popup = new Intent(context, QuickRecallActivity.class);
                            popup.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
                            context.startActivity(popup);
                        }
                    }
                }
            }
        };

        IntentFilter filter = new IntentFilter();
        filter.addAction(Intent.ACTION_SCREEN_ON);
        filter.addAction(Intent.ACTION_USER_PRESENT);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            registerReceiver(unlockReceiver, filter, Context.RECEIVER_NOT_EXPORTED);
        } else {
            registerReceiver(unlockReceiver, filter);
        }
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent != null && ACTION_NEXT.equals(intent.getAction())) {
            VocabPrefsHelper.advanceWord(this);
            VocabWidgetProvider.refreshAllWidgets(this);
        }

        Notification notification = buildNotification(this);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            startForeground(NOTIFICATION_ID, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_DATA_SYNC);
        } else {
            startForeground(NOTIFICATION_ID, notification);
        }
        return START_STICKY;
    }

    @Override
    public void onDestroy() {
        if (unlockReceiver != null) {
            try {
                unregisterReceiver(unlockReceiver);
            } catch (Exception ignored) {
            }
        }
        super.onDestroy();
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    public static void start(Context context) {
        Intent intent = new Intent(context, LockScreenService.class);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            context.startForegroundService(intent);
        } else {
            context.startService(intent);
        }
    }

    public static void stop(Context context) {
        Intent intent = new Intent(context, LockScreenService.class);
        context.stopService(intent);
    }

    public static void updateNotification(Context context) {
        NotificationManager nm = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
        if (nm != null) {
            nm.notify(NOTIFICATION_ID, buildNotification(context));
        }
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID,
                "Từ vựng màn hình khóa",
                NotificationManager.IMPORTANCE_LOW
            );
            channel.setDescription("Hiển thị từ vựng tiếng Anh trên màn hình khóa (không hiện nghĩa)");
            channel.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);
            channel.setShowBadge(false);
            NotificationManager nm = getSystemService(NotificationManager.class);
            if (nm != null) {
                nm.createNotificationChannel(channel);
            }
        }
    }

    private static Notification buildNotification(Context context) {
        VocabPrefsHelper.WordEntry entry = VocabPrefsHelper.getCurrentWord(context);
        String title = entry != null && !entry.word.isEmpty()
            ? entry.word
            : "ActiveRecall";

        StringBuilder sub = new StringBuilder();
        if (entry != null) {
            if (!entry.partOfSpeech.isEmpty()) sub.append("(").append(entry.partOfSpeech).append(") ");
            if (!entry.pronunciation.isEmpty()) sub.append(entry.pronunciation);
        }
        if (sub.length() == 0) {
            sub.append("Chạm để nhập nghĩa");
        }

        Intent checkIntent = new Intent(context, QuickRecallActivity.class);
        checkIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent checkPending = PendingIntent.getActivity(
            context,
            201,
            checkIntent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        Intent nextIntent = new Intent(context, LockScreenService.class);
        nextIntent.setAction(ACTION_NEXT);
        PendingIntent nextPending = PendingIntent.getService(
            context,
            202,
            nextIntent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        return new NotificationCompat.Builder(context, CHANNEL_ID)
            .setSmallIcon(R.mipmap.ic_launcher)
            .setContentTitle(title)
            .setContentText(sub.toString())
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setOngoing(true)
            .setOnlyAlertOnce(true)
            .setContentIntent(checkPending)
            .addAction(0, "Nhập kiểm tra", checkPending)
            .addAction(0, "Đổi từ", nextPending)
            .build();
    }
}
