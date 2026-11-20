package com.activerecall.vocab;

import android.graphics.Color;
import android.os.Build;
import android.os.Bundle;
import android.speech.tts.TextToSpeech;
import android.view.View;
import android.view.WindowManager;
import android.view.inputmethod.EditorInfo;
import android.widget.Button;
import android.widget.EditText;
import android.widget.LinearLayout;
import android.widget.TextView;

import androidx.appcompat.app.AppCompatActivity;

import java.util.Locale;

public class QuickRecallActivity extends AppCompatActivity {
    private TextView tvWord, tvMeta, tvResultStatus, tvResultMeaning, tvResultExample;
    private TextView btnSpeak, btnClose;
    private EditText etInput;
    private LinearLayout resultBox;
    private Button btnCheck, btnReveal, btnNext;

    private VocabPrefsHelper.WordEntry currentWord;
    private TextToSpeech tts;
    private boolean ttsReady = false;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
            setShowWhenLocked(true);
            setTurnScreenOn(true);
        } else {
            getWindow().addFlags(
                WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED |
                WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON
            );
        }

        setContentView(R.layout.activity_quick_recall);

        tvWord = findViewById(R.id.qr_word);
        tvMeta = findViewById(R.id.qr_meta);
        etInput = findViewById(R.id.qr_input);
        btnCheck = findViewById(R.id.qr_btn_check);
        btnReveal = findViewById(R.id.qr_btn_reveal);
        btnNext = findViewById(R.id.qr_btn_next);
        btnSpeak = findViewById(R.id.qr_btn_speak);
        btnClose = findViewById(R.id.qr_btn_close);
        resultBox = findViewById(R.id.qr_result_box);
        tvResultStatus = findViewById(R.id.qr_result_status);
        tvResultMeaning = findViewById(R.id.qr_result_meaning);
        tvResultExample = findViewById(R.id.qr_result_example);

        tts = new TextToSpeech(this, status -> {
            if (status == TextToSpeech.SUCCESS) {
                tts.setLanguage(Locale.US);
                tts.setSpeechRate(0.9f);
                ttsReady = true;
            }
        });

        loadWord(VocabPrefsHelper.getCurrentWord(this));

        btnCheck.setOnClickListener(v -> handleCheck());
        btnReveal.setOnClickListener(v -> handleReveal());
        btnNext.setOnClickListener(v -> {
            VocabPrefsHelper.WordEntry next = VocabPrefsHelper.advanceWord(this);
            VocabWidgetProvider.refreshAllWidgets(this);
            if (VocabPrefsHelper.isLockScreenEnabled(this)) {
                LockScreenService.updateNotification(this);
            }
            loadWord(next);
        });
        btnSpeak.setOnClickListener(v -> speakCurrentWord());
        btnClose.setOnClickListener(v -> finish());
        findViewById(R.id.qr_backdrop).setOnClickListener(v -> finish());

        etInput.setOnEditorActionListener((v, actionId, event) -> {
            if (actionId == EditorInfo.IME_ACTION_DONE) {
                handleCheck();
                return true;
            }
            return false;
        });
    }

    private void loadWord(VocabPrefsHelper.WordEntry entry) {
        currentWord = entry;
        etInput.setText("");
        etInput.setEnabled(true);
        btnCheck.setEnabled(true);
        btnReveal.setEnabled(true);
        resultBox.setVisibility(View.GONE);

        if (entry == null || entry.word.isEmpty()) {
            tvWord.setText("Chưa có từ vựng");
            tvMeta.setText("Hãy mở app ActiveRecall để đồng bộ dữ liệu");
            btnCheck.setEnabled(false);
            btnReveal.setEnabled(false);
            return;
        }

        tvWord.setText(entry.word);
        String meta = "";
        if (!entry.partOfSpeech.isEmpty()) meta += "(" + entry.partOfSpeech + ")  ";
        if (!entry.pronunciation.isEmpty()) meta += entry.pronunciation;
        tvMeta.setText(meta.trim());
        etInput.requestFocus();
    }

    private void handleCheck() {
        if (currentWord == null) return;
        String answer = etInput.getText().toString().trim();
        if (answer.isEmpty()) return;

        boolean correct = VocabPrefsHelper.checkMeaningMatch(answer, currentWord.meaning);
        VocabPrefsHelper.recordReview(this, currentWord.id, correct);
        showResult(correct, false);
    }

    private void handleReveal() {
        if (currentWord == null) return;
        VocabPrefsHelper.recordReview(this, currentWord.id, false);
        showResult(false, true);
    }

    private void showResult(boolean correct, boolean revealedOnly) {
        resultBox.setVisibility(View.VISIBLE);
        etInput.setEnabled(false);
        btnCheck.setEnabled(false);
        btnReveal.setEnabled(false);

        if (correct) {
            resultBox.setBackgroundColor(Color.parseColor("#3310B981"));
            tvResultStatus.setText("✓ Chính xác!");
            tvResultStatus.setTextColor(Color.parseColor("#34D399"));
        } else if (revealedOnly) {
            resultBox.setBackgroundColor(Color.parseColor("#33F59E0B"));
            tvResultStatus.setText("💡 Đáp án:");
            tvResultStatus.setTextColor(Color.parseColor("#FBBF24"));
        } else {
            resultBox.setBackgroundColor(Color.parseColor("#33F43F5E"));
            tvResultStatus.setText("✗ Chưa chính xác");
            tvResultStatus.setTextColor(Color.parseColor("#FB7185"));
        }

        tvResultMeaning.setText("Nghĩa: " + currentWord.meaning);
        if (!currentWord.example.isEmpty()) {
            tvResultExample.setVisibility(View.VISIBLE);
            tvResultExample.setText("Ví dụ: " + currentWord.example);
        } else {
            tvResultExample.setVisibility(View.GONE);
        }

        speakCurrentWord();
    }

    private void speakCurrentWord() {
        if (ttsReady && currentWord != null && !currentWord.word.isEmpty()) {
            tts.speak(currentWord.word, TextToSpeech.QUEUE_FLUSH, null, "qr_word");
        }
    }

    @Override
    protected void onDestroy() {
        if (tts != null) {
            tts.stop();
            tts.shutdown();
        }
        super.onDestroy();
    }
}
