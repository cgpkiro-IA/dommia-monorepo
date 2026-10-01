package com.dommia.resident.core.session

import com.dommia.resident.core.model.AnnualCampaign
import com.dommia.resident.core.model.AnnualCampaignQuote
import com.dommia.resident.core.model.FinancialStatus
import com.dommia.resident.core.model.MonthlyFinancialReport
import com.dommia.resident.core.network.ApiErrorHandler
import com.dommia.resident.core.network.ApiResult
import com.dommia.resident.core.network.FinanceApi

class ResidentFinanceRepository(
    private val financeApi: FinanceApi,
    private val sessionManager: SessionManager,
) {
    suspend fun getStatus(): ApiResult<FinancialStatus> = runRequest {
        val response = financeApi.getStatus()
        response.data.takeIf { response.success && it != null } ?: error(response.message ?: "No se pudo cargar el estado financiero.")
    }

    suspend fun getCampaigns(): ApiResult<List<AnnualCampaign>> = runRequest {
        val response = financeApi.getCampaigns()
        response.data.takeIf { response.success && it != null } ?: error(response.message ?: "No se pudieron cargar las campañas.")
    }

    suspend fun getCampaignQuote(campaignId: String): ApiResult<AnnualCampaignQuote> = runRequest {
        val response = financeApi.getCampaignQuote(campaignId)
        response.data.takeIf { response.success && it != null } ?: error(response.message ?: "No se pudo cotizar la campaña.")
    }

    suspend fun getMonthlyReports(): ApiResult<List<MonthlyFinancialReport>> = runRequest {
        val response = financeApi.getMonthlyReports()
        response.data.takeIf { response.success && it != null } ?: error(response.message ?: "No se pudieron cargar las rendiciones mensuales.")
    }

    suspend fun markMonthlyReportReviewed(reportId: String): ApiResult<Unit> = runRequest {
        val response = financeApi.markMonthlyReportReviewed(reportId)
        if (!response.success) error(response.message ?: "No se pudo registrar la revisión.")
    }

    suspend fun downloadMonthlyEvidence(evidenceId: String): ApiResult<ByteArray> = runRequest {
        val response = financeApi.downloadMonthlyEvidence(evidenceId)
        if (!response.isSuccessful) error(response.errorBody()?.string() ?: "La evidencia no está disponible.")
        response.body()?.bytes() ?: error("La evidencia llegó vacía.")
    }

    private suspend fun <T> runRequest(request: suspend () -> T): ApiResult<T> {
        return try {
            ApiResult.Success(request())
        } catch (exception: Exception) {
            val result = ApiErrorHandler.mapThrowable(exception)
            if (result.code == 401) sessionManager.expireSession()
            result
        }
    }
}
