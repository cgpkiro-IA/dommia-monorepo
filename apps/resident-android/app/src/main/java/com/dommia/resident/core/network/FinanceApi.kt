package com.dommia.resident.core.network

import com.dommia.resident.core.model.AnnualCampaign
import com.dommia.resident.core.model.AnnualCampaignQuote
import com.dommia.resident.core.model.ApiEnvelope
import com.dommia.resident.core.model.FinancialStatus
import com.dommia.resident.core.model.MonthlyFinancialReport
import okhttp3.ResponseBody
import retrofit2.Response
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.Path
import retrofit2.http.Streaming

interface FinanceApi {
    @GET("auth/app/resident/finance/status")
    suspend fun getStatus(): ApiEnvelope<FinancialStatus>

    @GET("auth/app/resident/finance/campaigns")
    suspend fun getCampaigns(): ApiEnvelope<List<AnnualCampaign>>

    @POST("auth/app/resident/finance/campaigns/{campaignId}/quote")
    suspend fun getCampaignQuote(@Path("campaignId") campaignId: String): ApiEnvelope<AnnualCampaignQuote>

    @GET("auth/app/resident/finance/monthly-reports")
    suspend fun getMonthlyReports(): ApiEnvelope<List<MonthlyFinancialReport>>

    @POST("auth/app/resident/finance/monthly-reports/{reportId}/review")
    suspend fun markMonthlyReportReviewed(@Path("reportId") reportId: String): ApiEnvelope<MonthlyReportReviewResult>

    @Streaming
    @GET("auth/app/resident/finance/monthly-reports/evidence/{evidenceId}/content")
    suspend fun downloadMonthlyEvidence(@Path("evidenceId") evidenceId: String): Response<ResponseBody>
}

@kotlinx.serialization.Serializable
data class MonthlyReportReviewResult(val reviewedAt: String? = null)
