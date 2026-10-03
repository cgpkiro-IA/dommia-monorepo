import SwiftUI

public struct DynamicQRModalView: View {
    @Environment(\.dismiss) private var dismiss
    public let residentName: String
    public let propertyAddress: String
    public let qrPayload: String
    public let totpCode: String

    @State private var timeRemaining = 45
    @State private var timerActive = true

    public init(
        residentName: String,
        propertyAddress: String,
        qrPayload: String = "dommia://qr/pass/demo-resident-token-9921",
        totpCode: String = "DOMMIA-9921"
    ) {
        self.residentName = residentName
        self.propertyAddress = propertyAddress
        self.qrPayload = qrPayload
        self.totpCode = totpCode
    }

    public var body: some View {
        NavigationStack {
            ZStack {
                DommiaTheme.canvas
                    .ignoresSafeArea()

                ScrollView {
                    VStack(spacing: 20) {
                        // Security Banner
                        HStack(spacing: 8) {
                            Image(systemName: "lock.shield.fill")
                                .font(.system(size: 14))
                                .foregroundStyle(DommiaTheme.emerald)

                            Text("CÓDIGO DE ACCESO SEGURO DINÁMICO")
                                .font(.system(size: 11, weight: .black))
                                .tracking(1.5)
                                .foregroundStyle(DommiaTheme.emeraldLight)
                        }
                        .padding(.vertical, 8)
                        .padding(.horizontal, 14)
                        .background(DommiaTheme.emeraldBadge)
                        .clipShape(Capsule())
                        .padding(.top, 10)

                        // QR Code Card
                        VStack(spacing: 16) {
                            Text(residentName)
                                .font(.system(size: 20, weight: .black))
                                .foregroundStyle(DommiaTheme.textPrimary)

                            Text(propertyAddress)
                                .font(.system(size: 13, weight: .medium))
                                .foregroundStyle(DommiaTheme.textMuted)

                            // QR Image Container
                            ZStack {
                                RoundedRectangle(cornerRadius: 20, style: .continuous)
                                    .fill(Color.white)
                                    .frame(width: 240, height: 240)
                                    .shadow(color: DommiaTheme.primaryBlue.opacity(0.2), radius: 20, y: 10)

                                if let qrImage = QRCodeHelper.generateQRCode(from: qrPayload) {
                                    Image(uiImage: qrImage)
                                        .interpolation(.none)
                                        .resizable()
                                        .scaledToFit()
                                        .frame(width: 200, height: 200)
                                } else {
                                    Image(systemName: "qrcode")
                                        .font(.system(size: 140))
                                        .foregroundStyle(Color.black)
                                }
                            }
                            .padding(.vertical, 8)

                            // Numerical Code Badge
                            HStack(spacing: 8) {
                                Text("CÓDIGO:")
                                    .font(.system(size: 11, weight: .bold))
                                    .foregroundStyle(DommiaTheme.textMuted)

                                Text(totpCode)
                                    .font(.system(size: 18, weight: .black, design: .monospaced))
                                    .foregroundStyle(DommiaTheme.blueLight)
                            }
                            .padding(.horizontal, 16)
                            .padding(.vertical, 8)
                            .background(DommiaTheme.inputBackground)
                            .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
                            .overlay(RoundedRectangle(cornerRadius: 12).stroke(DommiaTheme.borderLight, lineWidth: 1))

                            // Timer Countdown
                            VStack(spacing: 6) {
                                ProgressView(value: Double(timeRemaining), total: 60.0)
                                    .tint(DommiaTheme.emerald)
                                    .frame(width: 180)

                                Text("Se actualiza en \(timeRemaining)s")
                                    .font(.system(size: 12, weight: .semibold))
                                    .foregroundStyle(DommiaTheme.textMuted)
                            }
                        }
                        .padding(24)
                        .frame(maxWidth: .infinity)
                        .dommiaCard(cornerRadius: 28)
                        .padding(.horizontal, 20)

                        // Instruction Box
                        HStack(spacing: 12) {
                            Image(systemName: "info.circle.fill")
                                .font(.system(size: 20))
                                .foregroundStyle(DommiaTheme.primaryBlue)

                            Text("Muestra este código al guardia de caseta o acércalo al lector óptico para abrir la barrera.")
                                .font(.system(size: 13))
                                .foregroundStyle(DommiaTheme.textSecondary)
                                .lineSpacing(3)
                        }
                        .padding(16)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .background(DommiaTheme.surface)
                        .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
                        .overlay(RoundedRectangle(cornerRadius: 16).stroke(DommiaTheme.border, lineWidth: 1))
                        .padding(.horizontal, 20)

                        Spacer(minLength: 20)
                    }
                }
            }
            .navigationTitle("Mi Acceso")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cerrar") { dismiss() }
                        .foregroundStyle(DommiaTheme.blueLight)
                }
            }
            .onAppear {
                startTimer()
            }
        }
    }

    private func startTimer() {
        Timer.scheduledTimer(withTimeInterval: 1.0, repeats: true) { timer in
            if timeRemaining > 1 {
                timeRemaining -= 1
            } else {
                timeRemaining = 60
            }
        }
    }
}
