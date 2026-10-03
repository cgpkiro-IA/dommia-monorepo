import SwiftUI

public struct FinanceTabView: View {
    public let financeService: FinanceService
    @State private var status: ResidentFinanceStatus?
    @State private var campaigns: [ResidentFinanceCampaign] = []
    @State private var isLoading = false
    @State private var showSpeiModal = false

    public init(financeService: FinanceService) {
        self.financeService = financeService
    }

    public var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                // Header
                VStack(alignment: .leading, spacing: 2) {
                    Text("Mis Cuotas y Finanzas")
                        .font(.system(size: 22, weight: .black))
                        .foregroundStyle(.white)

                    Text("Control de pagos y transparencia de la privada")
                        .font(.system(size: 13))
                        .foregroundStyle(DommiaTheme.textMuted)
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(.horizontal, 16)
                .padding(.top, 16)

                // 1. Balance Summary Card
                VStack(alignment: .leading, spacing: 16) {
                    HStack {
                        VStack(alignment: .leading, spacing: 2) {
                            Text("SALDO AL DÍA")
                                .font(.system(size: 10, weight: .black))
                                .tracking(1.5)
                                .foregroundStyle(DommiaTheme.blueLight)

                            Text("$0.00")
                                .font(.system(size: 34, weight: .black))
                                .foregroundStyle(.white)

                            Text("Pesos Mexicanos (MXN)")
                                .font(.system(size: 11))
                                .foregroundStyle(DommiaTheme.textMuted)
                        }

                        Spacer()

                        VStack(alignment: .trailing, spacing: 6) {
                            HStack(spacing: 4) {
                                Image(systemName: "checkmark.shield.fill")
                                    .font(.system(size: 11))
                                Text("Al Corriente")
                                    .font(.system(size: 11, weight: .black))
                            }
                            .foregroundStyle(DommiaTheme.emeraldLight)
                            .padding(.horizontal, 10)
                            .padding(.vertical, 5)
                            .background(DommiaTheme.emeraldDark)
                            .clipShape(Capsule())
                            .overlay(Capsule().stroke(DommiaTheme.emerald.opacity(0.4), lineWidth: 1))

                            Text("Vivienda: Olivos 101")
                                .font(.system(size: 11))
                                .foregroundStyle(DommiaTheme.textMuted)
                        }
                    }

                    Divider().background(DommiaTheme.border)

                    // SPEI / Bank Transfer Button
                    Button {
                        showSpeiModal = true
                    } label: {
                        HStack {
                            ZStack {
                                RoundedRectangle(cornerRadius: 10)
                                    .fill(DommiaTheme.blueBadge)
                                    .frame(width: 34, height: 34)

                                Image(systemName: "banknote.fill")
                                    .font(.system(size: 16))
                                    .foregroundStyle(DommiaTheme.blueLight)
                            }

                            VStack(alignment: .leading, spacing: 2) {
                                Text("Datos de Transferencia (SPEI)")
                                    .font(.system(size: 13, weight: .bold))
                                    .foregroundStyle(.white)

                                Text("CLABE personalizada de tu privada")
                                    .font(.system(size: 11))
                                    .foregroundStyle(DommiaTheme.textMuted)
                            }

                            Spacer()

                            Image(systemName: "chevron.right")
                                .font(.system(size: 12, weight: .bold))
                                .foregroundStyle(DommiaTheme.textMuted)
                        }
                        .padding(12)
                        .background(DommiaTheme.surfaceCard)
                        .clipShape(RoundedRectangle(cornerRadius: 14))
                        .overlay(RoundedRectangle(cornerRadius: 14).stroke(DommiaTheme.border, lineWidth: 1))
                    }
                    .buttonStyle(.plain)
                }
                .padding(20)
                .background(DommiaTheme.residentCardGradient)
                .clipShape(RoundedRectangle(cornerRadius: 24, style: .continuous))
                .overlay(RoundedRectangle(cornerRadius: 24).stroke(DommiaTheme.borderLight, lineWidth: 1))
                .padding(.horizontal, 16)

                // 2. Active Campaigns
                VStack(alignment: .leading, spacing: 12) {
                    Text("CUOTAS Y APORTACIONES ACTIVAS")
                        .font(.system(size: 11, weight: .black))
                        .tracking(1.4)
                        .foregroundStyle(DommiaTheme.textMuted)
                        .padding(.horizontal, 20)

                    VStack(spacing: 10) {
                        campaignCard(
                            title: "Cuota de Mantenimiento Octubre 2026",
                            amount: "$1,250.00 MXN",
                            period: "Vencimiento: 15 Octubre",
                            isPaid: true
                        )

                        campaignCard(
                            title: "Fondo de Reserva y Seguridad 2026",
                            amount: "$400.00 MXN",
                            period: "Aportación Trimestral",
                            isPaid: true
                        )
                    }
                    .padding(.horizontal, 16)
                }

                // 3. Transparency & Monthly Reports
                VStack(alignment: .leading, spacing: 12) {
                    Text("TRANSPARENCIA COMUNITARIA")
                        .font(.system(size: 11, weight: .black))
                        .tracking(1.4)
                        .foregroundStyle(DommiaTheme.textMuted)
                        .padding(.horizontal, 20)

                    VStack(alignment: .leading, spacing: 12) {
                        HStack(spacing: 12) {
                            ZStack {
                                RoundedRectangle(cornerRadius: 12)
                                    .fill(DommiaTheme.emeraldBadge)
                                    .frame(width: 40, height: 40)

                                Image(systemName: "chart.pie.fill")
                                    .font(.system(size: 18))
                                    .foregroundStyle(DommiaTheme.emeraldLight)
                            }

                            VStack(alignment: .leading, spacing: 2) {
                                Text("Rendición Mensual Publicada")
                                    .font(.system(size: 14, weight: .bold))
                                    .foregroundStyle(.white)

                                Text("Revisión de gastos e ingresos comunales")
                                    .font(.system(size: 12))
                                    .foregroundStyle(DommiaTheme.textMuted)
                            }

                            Spacer()

                            Image(systemName: "doc.text.magnifyingglass")
                                .foregroundStyle(DommiaTheme.textMuted)
                        }
                    }
                    .padding(16)
                    .dommiaCard(cornerRadius: 20)
                    .padding(.horizontal, 16)
                }

                Spacer(minLength: 24)
            }
        }
        .task {
            await loadFinance()
        }
        .sheet(isPresented: $showSpeiModal) {
            SpeiDetailsSheetView()
        }
    }

    private func campaignCard(title: String, amount: String, period: String, isPaid: Bool) -> some View {
        HStack(spacing: 12) {
            ZStack {
                RoundedRectangle(cornerRadius: 12)
                    .fill(DommiaTheme.surfaceCard)
                    .frame(width: 40, height: 40)

                Image(systemName: "creditcard.and.123")
                    .font(.system(size: 18))
                    .foregroundStyle(DommiaTheme.blueLight)
            }

            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .font(.system(size: 13, weight: .bold))
                    .foregroundStyle(.white)

                Text(period)
                    .font(.system(size: 11))
                    .foregroundStyle(DommiaTheme.textMuted)
            }

            Spacer()

            VStack(alignment: .trailing, spacing: 3) {
                Text(amount)
                    .font(.system(size: 13, weight: .black))
                    .foregroundStyle(.white)

                Text(isPaid ? "PAGADA" : "PENDIENTE")
                    .font(.system(size: 9, weight: .black))
                    .foregroundStyle(isPaid ? DommiaTheme.emeraldLight : DommiaTheme.danger)
            }
        }
        .padding(14)
        .dommiaCard(cornerRadius: 18)
    }

    private func loadFinance() async {
        isLoading = true
        defer { isLoading = false }
        if let s = try? await financeService.status() {
            status = s
        }
        if let c = try? await financeService.campaigns() {
            campaigns = c
        }
    }
}

// Modal SPEI
struct SpeiDetailsSheetView: View {
    @Environment(\.dismiss) private var dismiss
    @State private var copiedClabe = false
    @State private var copiedReference = false

    private let clabe = "646180123456789012"
    private let reference = "OLIVOS-101"

    var body: some View {
        NavigationStack {
            ZStack {
                DommiaTheme.canvas
                    .ignoresSafeArea()

                ScrollView {
                    VStack(alignment: .leading, spacing: 20) {
                        VStack(alignment: .leading, spacing: 6) {
                            Text("Datos de Pago por Transferencia")
                                .font(.system(size: 20, weight: .black))
                                .foregroundStyle(.white)

                            Text("Transfiere desde la app de tu banco con acreditación automática.")
                                .font(.system(size: 13))
                                .foregroundStyle(DommiaTheme.textMuted)
                        }

                        VStack(spacing: 12) {
                            speiRow(label: "Banco Receptor", value: "STP (Sistema de Pagos)")
                            speiRow(label: "Beneficiario", value: "Fracc. Residencial Las Palmas")

                            // CLABE with copy
                            HStack {
                                VStack(alignment: .leading, spacing: 2) {
                                    Text("CLABE Interbancaria")
                                        .font(.system(size: 11, weight: .bold))
                                        .foregroundStyle(DommiaTheme.textMuted)
                                    Text(clabe)
                                        .font(.system(size: 15, weight: .black, design: .monospaced))
                                        .foregroundStyle(.white)
                                }
                                Spacer()
                                Button {
                                    UIPasteboard.general.string = clabe
                                    copiedClabe = true
                                    DispatchQueue.main.asyncAfter(deadline: .now() + 1.8) { copiedClabe = false }
                                } label: {
                                    HStack(spacing: 4) {
                                        Image(systemName: copiedClabe ? "checkmark" : "doc.on.doc")
                                        Text(copiedClabe ? "Copiado" : "Copiar")
                                    }
                                    .font(.system(size: 11, weight: .bold))
                                    .foregroundStyle(copiedClabe ? DommiaTheme.emeraldLight : DommiaTheme.blueLight)
                                    .padding(.horizontal, 10)
                                    .padding(.vertical, 6)
                                    .background(DommiaTheme.inputBackground)
                                    .clipShape(RoundedRectangle(cornerRadius: 8))
                                }
                                .buttonStyle(.plain)
                            }
                            .padding(12)
                            .background(DommiaTheme.surface)
                            .clipShape(RoundedRectangle(cornerRadius: 14))

                            // Reference with copy
                            HStack {
                                VStack(alignment: .leading, spacing: 2) {
                                    Text("Concepto / Referencia")
                                        .font(.system(size: 11, weight: .bold))
                                        .foregroundStyle(DommiaTheme.textMuted)
                                    Text(reference)
                                        .font(.system(size: 15, weight: .black, design: .monospaced))
                                        .foregroundStyle(.white)
                                }
                                Spacer()
                                Button {
                                    UIPasteboard.general.string = reference
                                    copiedReference = true
                                    DispatchQueue.main.asyncAfter(deadline: .now() + 1.8) { copiedReference = false }
                                } label: {
                                    HStack(spacing: 4) {
                                        Image(systemName: copiedReference ? "checkmark" : "doc.on.doc")
                                        Text(copiedReference ? "Copiado" : "Copiar")
                                    }
                                    .font(.system(size: 11, weight: .bold))
                                    .foregroundStyle(copiedReference ? DommiaTheme.emeraldLight : DommiaTheme.blueLight)
                                    .padding(.horizontal, 10)
                                    .padding(.vertical, 6)
                                    .background(DommiaTheme.inputBackground)
                                    .clipShape(RoundedRectangle(cornerRadius: 8))
                                }
                                .buttonStyle(.plain)
                            }
                            .padding(12)
                            .background(DommiaTheme.surface)
                            .clipShape(RoundedRectangle(cornerRadius: 14))
                        }

                        HStack(spacing: 10) {
                            Image(systemName: "shield.checkered")
                                .foregroundStyle(DommiaTheme.emerald)
                            Text("Tu pago se concilia automáticamente con tu vivienda mediante el concepto único.")
                                .font(.system(size: 12))
                                .foregroundStyle(DommiaTheme.textSecondary)
                        }
                        .padding(14)
                        .background(DommiaTheme.surface)
                        .clipShape(RoundedRectangle(cornerRadius: 14))

                        Spacer()
                    }
                    .padding(24)
                }
            }
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cerrar") { dismiss() }
                        .foregroundStyle(DommiaTheme.blueLight)
                }
            }
        }
    }

    private func speiRow(label: String, value: String) -> some View {
        HStack {
            VStack(alignment: .leading, spacing: 2) {
                Text(label)
                    .font(.system(size: 11, weight: .bold))
                    .foregroundStyle(DommiaTheme.textMuted)
                Text(value)
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundStyle(.white)
            }
            Spacer()
        }
        .padding(12)
        .background(DommiaTheme.surface)
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }
}
