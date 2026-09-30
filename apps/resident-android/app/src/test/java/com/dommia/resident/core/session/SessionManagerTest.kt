package com.dommia.resident.core.session

import android.content.Context
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey
import androidx.test.core.app.ApplicationProvider
import org.junit.Assert.assertTrue
import org.junit.Test

class SessionManagerTest {
    @Test
    fun restoreSession_marksExpiredWhenAccessTokenExistsWithoutRefreshToken() {
        val context = ApplicationProvider.getApplicationContext<Context>()
        val masterKey = MasterKey.Builder(context)
            .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
            .build()

        val prefs = EncryptedSharedPreferences.create(
            "dommia_resident_session",
            MasterKey.DEFAULT_MASTER_KEY_ALIAS,
            context,
            EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
            EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM,
        )

        prefs.edit()
            .putString("access_token", "stale-access-token")
            .apply()

        val sessionManager = SessionManager(context)

        assertTrue(sessionManager.state.value is AuthState.Expired)
    }
}
