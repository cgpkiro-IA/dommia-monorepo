package com.dommia.resident.core.network

import com.dommia.resident.core.model.AccessCredential
import com.dommia.resident.core.model.ActiveDelivery
import com.dommia.resident.core.model.ActiveService
import com.dommia.resident.core.model.ApiEnvelope
import retrofit2.http.GET

interface AccessApi {
    @GET("auth/app/resident/access-credential")
    suspend fun getCredential(): ApiEnvelope<AccessCredential>

    @GET("auth/app/resident/access-credential/active-services")
    suspend fun getActiveServices(): ApiEnvelope<List<ActiveService>>

    @GET("auth/app/resident/access-credential/active-deliveries")
    suspend fun getActiveDeliveries(): ApiEnvelope<List<ActiveDelivery>>
}
