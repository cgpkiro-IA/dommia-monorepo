package com.dommia.resident.core.network

import com.dommia.resident.BuildConfig
import com.dommia.resident.core.session.SessionManager
import com.jakewharton.retrofit2.converter.kotlinx.serialization.asConverterFactory
import kotlinx.serialization.json.Json
import okhttp3.Authenticator
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.Response
import okhttp3.Route
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit

object ApiClient {
    fun create(sessionManager: SessionManager): Retrofit {
        val logging = HttpLoggingInterceptor().apply {
            level = HttpLoggingInterceptor.Level.BODY
        }

        val json = Json {
            ignoreUnknownKeys = true
            explicitNulls = false
        }

        val refreshRetrofit = Retrofit.Builder()
            .baseUrl(BuildConfig.API_BASE_URL)
            .addConverterFactory(json.asConverterFactory("application/json".toMediaType()))
            .build()

        val client = OkHttpClient.Builder()
            .authenticator(object : Authenticator {
                override fun authenticate(route: Route?, response: Response): Request? {
                    if (responseCount(response) >= 2) {
                        sessionManager.clearSession()
                        return null
                    }

                    val requestPath = response.request.url.encodedPath
                    if (requestPath.contains("/auth/app/resident/login")
                        || requestPath.contains("/auth/app/resident/refresh")
                    ) {
                        return null
                    }

                    val refreshToken = sessionManager.refreshToken ?: run {
                        sessionManager.clearSession()
                        return null
                    }

                    return try {
                        val authApi = refreshRetrofit.create(AuthApi::class.java)
                        val refreshResponse = authApi.refresh(ResidentRefreshRequest(refreshToken))

                        if (refreshResponse.success && refreshResponse.data != null) {
                            sessionManager.saveSession(
                                accessToken = refreshResponse.data.accessToken,
                                refreshToken = refreshResponse.data.refreshToken,
                                resident = refreshResponse.data.resident ?: sessionManager.profile,
                            )

                            response.request.newBuilder()
                                .header("Authorization", "Bearer ${refreshResponse.data.accessToken}")
                                .header("Accept", "application/json")
                                .header("Content-Type", "application/json")
                                .build()
                        } else {
                            sessionManager.clearSession()
                            null
                        }
                    } catch (_: Exception) {
                        sessionManager.clearSession()
                        null
                    }
                }
            })
            .addInterceptor(AuthInterceptor(sessionManager))
            .addInterceptor(logging)
            .build()

        return Retrofit.Builder()
            .baseUrl(BuildConfig.API_BASE_URL)
            .client(client)
            .addConverterFactory(json.asConverterFactory("application/json".toMediaType()))
            .build()
    }

    private fun responseCount(response: Response): Int {
        var count = 1
        var prior = response.priorResponse
        while (prior != null) {
            count += 1
            prior = prior.priorResponse
        }
        return count
    }
}
