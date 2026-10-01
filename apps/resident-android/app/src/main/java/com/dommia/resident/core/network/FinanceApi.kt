package com.dommia.resident.core.network

import com.dommia.resident.core.model.AnnualCampaign
import com.dommia.resident.core.model.AnnualCampaignQuote
import com.dommia.resident.core.model.ApiEnvelope
import com.dommia.resident.core.model.FinancialStatus
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.Path

interface FinanceApi {
    @GET("auth/app/resident/finance/status")
    suspend fun getStatus(): ApiEnvelope<FinancialStatus>

    @GET("auth/app/resident/finance/campaigns")
    suspend fun getCampaigns(): ApiEnvelope<List<AnnualCampaign>>

    @POST("auth/app/resident/finance/campaigns/{campaignId}/quote")
    suspend fun getCampaignQuote(@Path("campaignId") campaignId: String): ApiEnvelope<AnnualCampaignQuote>
}
