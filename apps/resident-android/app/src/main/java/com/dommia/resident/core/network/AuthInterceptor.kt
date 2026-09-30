package com.dommia.resident.core.network

import com.dommia.resident.core.session.SessionManager
import okhttp3.Interceptor
import okhttp3.Response

class AuthInterceptor(
    private val sessionManager: SessionManager,
) : Interceptor {
    override fun intercept(chain: Interceptor.Chain): Response {
        val originalRequest = chain.request()
        val isPublicEndpoint = originalRequest.url.encodedPath.contains("/auth/app/resident/login")
            || originalRequest.url.encodedPath.contains("/auth/app/resident/refresh")
            || originalRequest.url.encodedPath.contains("/auth/app/resident/change-password")

        val request = if (isPublicEndpoint || sessionManager.accessToken == null) {
            originalRequest
        } else {
            originalRequest.newBuilder()
                .header("Authorization", "Bearer ${sessionManager.accessToken}")
                .header("Accept", "application/json")
                .header("Content-Type", "application/json")
                .build()
        }

        return chain.proceed(request)
    }
}
