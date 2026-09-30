package com.dommia.resident.core.network

import com.dommia.resident.core.model.CreateVisitorPassRequest
import com.dommia.resident.core.model.ResidentNotice
import com.dommia.resident.core.model.VisitorPass
import retrofit2.http.Body
import retrofit2.http.DELETE
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.Path

interface ResidentContentApi {
    @GET("auth/app/resident/notices")
    suspend fun getNotices(): ApiEnvelope<List<ResidentNotice>>

    @GET("auth/app/resident/invitations")
    suspend fun getVisitorPasses(): ApiEnvelope<List<VisitorPass>>

    @POST("auth/app/resident/invitations")
    suspend fun createVisitorPass(@Body request: CreateVisitorPassRequest): ApiEnvelope<VisitorPass>

    @DELETE("auth/app/resident/invitations/{id}")
    suspend fun revokeVisitorPass(@Path("id") id: String): ApiEnvelope<VisitorPass>
}
