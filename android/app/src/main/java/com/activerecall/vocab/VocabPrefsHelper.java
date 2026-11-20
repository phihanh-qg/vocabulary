package com.activerecall.vocab;

import android.content.Context;
import android.content.SharedPreferences;

import org.json.JSONArray;
import org.json.JSONObject;

import java.text.Normalizer;
import java.util.Locale;

public class VocabPrefsHelper {
    private static final String PREFS_NAME = "ActiveRecallWidgetPrefs";
    private static final String KEY_WORDS_JSON = "words_json";
    private static final String KEY_CURRENT_INDEX = "current_index";
    private static final String KEY_LOCKSCREEN_ENABLED = "lockscreen_enabled";
    private static final String KEY_AUTO_POPUP_UNLOCK = "auto_popup_unlock";
    private static final String KEY_PENDING_REVIEWS = "pending_reviews_json";

    public static class WordEntry {
        public String id;
        public String word;
        public String meaning;
        public String pronunciation;
        public String partOfSpeech;
        public String example;
    }

    private static SharedPreferences prefs(Context ctx) {
        return ctx.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
    }

    public static void saveWordsJson(Context ctx, String json) {
        prefs(ctx).edit().putString(KEY_WORDS_JSON, json).apply();
    }

    public static void setLockScreenConfig(Context ctx, boolean enabled, boolean autoPopup) {
        prefs(ctx).edit()
            .putBoolean(KEY_LOCKSCREEN_ENABLED, enabled)
            .putBoolean(KEY_AUTO_POPUP_UNLOCK, autoPopup)
            .apply();
    }

    public static boolean isLockScreenEnabled(Context ctx) {
        return prefs(ctx).getBoolean(KEY_LOCKSCREEN_ENABLED, false);
    }

    public static boolean isAutoPopupOnUnlock(Context ctx) {
        return prefs(ctx).getBoolean(KEY_AUTO_POPUP_UNLOCK, false);
    }

    public static WordEntry getCurrentWord(Context ctx) {
        try {
            String raw = prefs(ctx).getString(KEY_WORDS_JSON, "[]");
            JSONArray arr = new JSONArray(raw);
            if (arr.length() == 0) return null;

            int idx = prefs(ctx).getInt(KEY_CURRENT_INDEX, 0);
            if (idx < 0 || idx >= arr.length()) idx = 0;

            JSONObject obj = arr.getJSONObject(idx);
            WordEntry entry = new WordEntry();
            entry.id = obj.optString("id", "");
            entry.word = obj.optString("word", "");
            entry.meaning = obj.optString("meaning", "");
            entry.pronunciation = obj.optString("pronunciation", "");
            entry.partOfSpeech = obj.optString("part_of_speech", "");
            entry.example = obj.optString("example", "");
            return entry;
        } catch (Exception e) {
            return null;
        }
    }

    public static WordEntry advanceWord(Context ctx) {
        try {
            String raw = prefs(ctx).getString(KEY_WORDS_JSON, "[]");
            JSONArray arr = new JSONArray(raw);
            if (arr.length() == 0) return null;

            int idx = prefs(ctx).getInt(KEY_CURRENT_INDEX, 0);
            idx = (idx + 1) % arr.length();
            prefs(ctx).edit().putInt(KEY_CURRENT_INDEX, idx).apply();
            return getCurrentWord(ctx);
        } catch (Exception e) {
            return null;
        }
    }

    public static void recordReview(Context ctx, String wordId, boolean correct) {
        if (wordId == null || wordId.isEmpty()) return;
        try {
            String raw = prefs(ctx).getString(KEY_PENDING_REVIEWS, "[]");
            JSONArray arr = new JSONArray(raw);
            JSONObject item = new JSONObject();
            item.put("wordId", wordId);
            item.put("correct", correct);
            item.put("reviewedAt", System.currentTimeMillis());
            arr.put(item);
            prefs(ctx).edit().putString(KEY_PENDING_REVIEWS, arr.toString()).apply();
        } catch (Exception ignored) {
        }
    }

    public static String popPendingReviewsJson(Context ctx) {
        String raw = prefs(ctx).getString(KEY_PENDING_REVIEWS, "[]");
        prefs(ctx).edit().putString(KEY_PENDING_REVIEWS, "[]").apply();
        return raw;
    }

    private static String normalizeText(String s) {
        if (s == null) return "";
        String lower = s.toLowerCase(Locale.ROOT).trim();
        lower = lower.replace("đ", "d");
        String decomposed = Normalizer.normalize(lower, Normalizer.Form.NFD);
        String noAccents = decomposed.replaceAll("\\p{InCombiningDiacriticalMarks}+", "");
        return noAccents.replaceAll("[^a-z0-9\\s]", " ").replaceAll("\\s+", " ").trim();
    }

    public static boolean checkMeaningMatch(String userInput, String expectedMeaning) {
        String normInput = normalizeText(userInput);
        if (normInput.length() < 2) return false;

        String[] parts = expectedMeaning.split("[,;/()]");
        for (String part : parts) {
            String normPart = normalizeText(part);
            if (normPart.isEmpty()) continue;
            if (normPart.equals(normInput)) return true;
            if (normPart.length() >= 3 && normInput.length() >= 3) {
                if (normPart.contains(normInput) || normInput.contains(normPart)) {
                    return true;
                }
            }
        }
        return false;
    }
}
