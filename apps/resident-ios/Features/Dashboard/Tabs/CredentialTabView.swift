import SwiftUI

public struct CredentialTabView: View {
    public let profile: ResidentProfile?
    public let tenantSlug: String
    public let onSwitchTab: (ResidentTabKey) -> Void

    @State private var showQRModal = false
    @State private var tenantCopied = false

    public init(
        profile: ResidentProfile?,
        tenantSlug: String,
        onSwitchTab: @escaping (ResidentTabKey) -> Void
    ) {
        self.profile = profile
        self.tenantSlug = tenantSlug
        self.onSwitchTab = onSwitchTab
    }

    private var residentName: String {
        if let first = profile?.firstName, let last = profile?.lastName {
            return "\(first) \(last)"
        }
        return "Carlos Mendoza"
    }

    private var propertyAddress: String {
        return "Paseo de los Olivos 101"
    }

    private var roleName: String {
        if profile?.role == "OWNER" { return "Propietario" }
        return "Residente"
    }

    public var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                // 1. Digital Credential Card (Gradient Luxury Card)
                VStack(alignment: .leading, spacing: 18) {
                    // Card Top Row
                    HStack(alignment: .top) {
                        VStack(alignment: .leading, spacing: 3) {
                            Text("CREDENCIAL DIGITAL")
                                .font(.system(size: 10, weight: .black))
                                .tracking(1.8)
                                .foregroundStyle(DommiaTheme.blueLight)

                            Text("Fracc. Las Palmas")
                                .font(.system(size: 17, weight: .black))
                                .foregroundStyle(.white)

                            Button {
                                UIPasteboard.general.string = tenantSlug
                                tenantCopied = true
                                DispatchQueue.main.asyncAfter(deadline: .now() + 1.8) {
                                    tenantCopied = false
                                }
                            } label: {
                                HStack(spacing: 4) {
                                    Image(systemName: tenantCopied ? "checkmark" : "doc.on.doc")
                                        .font(.system(size: 10))
                                    Text("IDTENANT: \(tenantSlug)")
                                        .font(.system(size: 10, weight: .bold, design: .monospaced))
                                }
                                .foregroundStyle(tenantCopied ? DommiaTheme.emeraldLight : DommiaTheme.blueLight)
                                .padding(.horizontal, 6)
                                .padding(.vertical, 3)
                                .background(DommiaTheme.inputBackground)
                                .clipShape(RoundedRectangle(cornerRadius: 6))
                            }
                            .buttonStyle(.plain)
                        }

                        Spacer()

                        // Status Pill (Al Corriente)
                        Button {
                            onSwitchTab(.finance)
                        } label: {
                            HStack(spacing: 5) {
                                Image(systemName: "checkmark.circle.fill")
                                    .font(.system(size: 11))
                                Text("Al Corriente ›")
                                    .font(.system(size: 11, weight: .black))
                            }
                            .foregroundStyle(DommiaTheme.emeraldLight)
                            .padding(.horizontal, 10)
                            .padding(.vertical, 5)
                            .background(DommiaTheme.emeraldDark)
                            .clipShape(Capsule())
                            .overlay(Capsule().stroke(DommiaTheme.emerald.opacity(0.4), lineWidth: 1))
                        }
                    }

                    // Card Body
                    VStack(alignment: .leading, spacing: 4) {
                        Text("COLONO ACREDITADO")
                            .font(.system(size: 10, weight: .bold))
                            .tracking(1.2)
                            .foregroundStyle(DommiaTheme.textMuted)

                        Text(residentName)
                            .font(.system(size: 22, weight: .black))
                            .foregroundStyle(.white)

                        HStack(spacing: 6) {
                            Image(systemName: "house.fill")
                                .font(.system(size: 12))
                                .foregroundStyle(DommiaTheme.primaryBlue)

                            Text(propertyAddress)
                                .font(.system(size: 13, weight: .medium))
                                .foregroundStyle(DommiaTheme.textSecondary)
                        }
                        .padding(.top, 2)

                        HStack(spacing: 6) {
                            Text(roleName)
                                .font(.system(size: 10, weight: .bold))
                                .padding(.horizontal, 8)
                                .padding(.vertical, 3)
                                .background(DommiaTheme.surface)
                                .clipShape(RoundedRectangle(cornerRadius: 6))
                                .overlay(RoundedRectangle(cornerRadius: 6).stroke(DommiaTheme.border, lineWidth: 1))
                                .foregroundStyle(DommiaTheme.textSecondary)

                            Text("TAG ACTIVO")
                                .font(.system(size: 10, weight: .bold))
                                .padding(.horizontal, 8)
                                .padding(.vertical, 3)
                                .background(DommiaTheme.emeraldBadge)
                                .clipShape(RoundedRectangle(cornerRadius: 6))
                                .foregroundStyle(DommiaTheme.emeraldLight)
                        }
                        .padding(.top, 4)
                    }

                    // Card Footer / QR Trigger Action
                    Button {
                        showQRModal = true
                    } label: {
                        HStack(spacing: 12) {
                            ZStack {
                                RoundedRectangle(cornerRadius: 12, style: .continuous)
                                    .fill(DommiaTheme.primaryBlue)
                                    .frame(width: 42, height: 42)

                                Image(systemName: "qrcode")
                                    .font(.system(size: 22, weight: .bold))
                                    .foregroundStyle(.white)
                            }

                            VStack(alignment: .leading, spacing: 2) {
                                Text("Ver Código QR Dinámico")
                                    .font(.system(size: 14, weight: .black))
                                    .foregroundStyle(.white)

                                Text("DOMMIA-9921 • Válido para acceso")
                                    .font(.system(size: 11, design: .monospaced))
                                    .foregroundStyle(DommiaTheme.blueLight)
                            }

                            Spacer()

                            Image(systemName: "chevron.right")
                                .font(.system(size: 14, weight: .bold))
                                .foregroundStyle(DommiaTheme.textMuted)
                        }
                        .padding(12)
                        .background(Color.white.opacity(0.06))
                        .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
                        .overlay(RoundedRectangle(cornerRadius: 16).stroke(Color.white.opacity(0.12), lineWidth: 1))
                    }
                    .buttonStyle(.plain)
                }
                .padding(20)
                .background(DommiaTheme.residentCardGradient)
                .clipShape(RoundedRectangle(cornerRadius: 26, style: .continuous))
                .overlay(RoundedRectangle(cornerRadius: 26).stroke(DommiaTheme.borderLight, lineWidth: 1))
                .shadow(color: DommiaTheme.primaryBlue.opacity(0.18), radius: 20, y: 8)
                .padding(.horizontal, 16)
                .padding(.top, 12)

                // 2. Quick Actions Section
                VStack(alignment: .leading, spacing: 12) {
                    Text("ACCIONES RÁPIDAS")
                        .font(.system(size: 11, weight: .black))
                        .tracking(1.4)
                        .foregroundStyle(DommiaTheme.textMuted)
                        .padding(.horizontal, 20)

                    LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
                        quickActionTile(
                            icon: "person.crop.circle.badge.plus",
                            color: DommiaTheme.primaryBlue,
                            title: "Generar Pase",
                            subtitle: "Invitar visita"
                        ) {
                            onSwitchTab(.passes)
                        }

                        quickActionTile(
                            icon: "megaphone.fill",
                            color: Color.orange,
                            title: "Circulares",
                            subtitle: "2 avisos nuevos"
                        ) {
                            onSwitchTab(.notices)
                        }

                        quickActionTile(
                            icon: "creditcard.fill",
                            color: DommiaTheme.emerald,
                            title: "Mis Cuotas",
                            subtitle: "Historial y pago"
                        ) {
                            onSwitchTab(.finance)
                        }

                        quickActionTile(
                            icon: "phone.fill",
                            color: Color.purple,
                            title: "Caseta Norte",
                            subtitle: "Llamada directa"
                        ) {
                            // Acción rápida de caseta
                        }
                    }
                    .padding(.horizontal, 16)
                }

                // 3. Realtime Alerts (Deliveries & Services)
                VStack(alignment: .leading, spacing: 12) {
                    Text("ACTIVIDAD EN CASETA")
                        .font(.system(size: 11, weight: .black))
                        .tracking(1.4)
                        .foregroundStyle(DommiaTheme.textMuted)
                        .padding(.horizontal, 20)

                    VStack(spacing: 10) {
                        alertRow(
                            icon: "shippingbox.fill",
                            iconColor: Color.blue,
                            title: "Paquete en Resguardo",
                            subtitle: "Amazon México • Caseta Principal Norte",
                            badge: "Por recoger"
                        )

                        alertRow(
                            icon: "wrench.and.screwdriver.fill",
                            iconColor: Color.orange,
                            title: "Técnico en Camino",
                            subtitle: "Totalplay Internet • Ingresó 16:42 hrs",
                            badge: "En tránsito"
                        )
                    }
                    .padding(.horizontal, 16)
                }

                Spacer(minLength: 24)
            }
        }
        .sheet(isPresented: $showQRModal) {
            DynamicQRModalView(
                residentName: residentName,
                propertyAddress: propertyAddress
            )
        }
    }

    private func quickActionTile(
        icon: String,
        color: Color,
        title: String,
        subtitle: String,
        action: @escaping () -> Void
    ) -> some View {
        Button(action: action) {
            VStack(alignment: .leading, spacing: 10) {
                ZStack {
                    RoundedRectangle(cornerRadius: 12, style: .continuous)
                        .fill(color.opacity(0.18))
                        .frame(width: 38, height: 38)

                    Image(systemName: icon)
                        .font(.system(size: 18, weight: .bold))
                        .foregroundStyle(color)
                }

                VStack(alignment: .leading, spacing: 2) {
                    Text(title)
                        .font(.system(size: 14, weight: .bold))
                        .foregroundStyle(DommiaTheme.textPrimary)

                    Text(subtitle)
                        .font(.system(size: 11))
                        .foregroundStyle(DommiaTheme.textMuted)
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(14)
            .dommiaCard(cornerRadius: 18)
        }
        .buttonStyle(.plain)
    }

    private func alertRow(
        icon: String,
        iconColor: Color,
        title: String,
        subtitle: String,
        badge: String
    ) -> some View {
        HStack(spacing: 12) {
            ZStack {
                RoundedRectangle(cornerRadius: 12, style: .continuous)
                    .fill(iconColor.opacity(0.15))
                    .frame(width: 40, height: 40)

                Image(systemName: icon)
                    .font(.system(size: 18, weight: .bold))
                    .foregroundStyle(iconColor)
            }

            VStack(alignment: .leading, spacing: 3) {
                Text(title)
                    .font(.system(size: 14, weight: .bold))
                    .foregroundStyle(DommiaTheme.textPrimary)

                Text(subtitle)
                    .font(.system(size: 12))
                    .foregroundStyle(DommiaTheme.textMuted)
            }

            Spacer()

            Text(badge)
                .font(.system(size: 10, weight: .bold))
                .padding(.horizontal, 8)
                .padding(.vertical, 4)
                .background(DommiaTheme.surfaceCard)
                .clipShape(Capsule())
                .foregroundStyle(DommiaTheme.textSecondary)
                .overlay(Capsule().stroke(DommiaTheme.border, lineWidth: 1))
        }
        .padding(14)
        .frame(maxWidth: .infinity)
        .dommiaCard(cornerRadius: 18)
    }
}
