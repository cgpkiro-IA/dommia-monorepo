import SwiftUI

public struct PassesTabView: View {
    public let invitationsService: InvitationsService
    @State private var passes: [ResidentInvitation] = []
    @State private var isLoading = false
    @State private var showCreateModal = false
    @State private var selectedPassToShare: ResidentInvitation?
    @State private var passToRevoke: ResidentInvitation?
    @State private var showRevokeAlert = false

    public init(invitationsService: InvitationsService) {
        self.invitationsService = invitationsService
    }

    public var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                // Header + New Pass Action
                HStack(alignment: .center) {
                    VStack(alignment: .leading, spacing: 2) {
                        Text("Pases de Visita")
                            .font(.system(size: 22, weight: .black))
                            .foregroundStyle(.white)

                        Text("Genera y comparte códigos QR de acceso")
                            .font(.system(size: 13))
                            .foregroundStyle(DommiaTheme.textMuted)
                    }

                    Spacer()

                    Button {
                        showCreateModal = true
                    } label: {
                        HStack(spacing: 6) {
                            Image(systemName: "plus")
                                .font(.system(size: 13, weight: .bold))
                            Text("Nuevo Pase")
                                .font(.system(size: 13, weight: .bold))
                        }
                        .padding(.horizontal, 14)
                        .padding(.vertical, 9)
                        .background(DommiaTheme.primaryBlue)
                        .clipShape(Capsule())
                        .foregroundStyle(.white)
                        .shadow(color: DommiaTheme.primaryBlue.opacity(0.3), radius: 8, y: 3)
                    }
                    .buttonStyle(.plain)
                }
                .padding(.horizontal, 16)
                .padding(.top, 16)

                // Passes List
                if isLoading && passes.isEmpty {
                    ProgressView().tint(.white).padding(40)
                } else if passes.isEmpty {
                    VStack(spacing: 12) {
                        Image(systemName: "person.crop.circle.badge.plus")
                            .font(.system(size: 44))
                            .foregroundStyle(DommiaTheme.textMuted)

                        Text("No tienes pases activos")
                            .font(.system(size: 16, weight: .bold))
                            .foregroundStyle(.white)

                        Text("Genera un pase QR para que tus visitas ingresen sin demoras en caseta.")
                            .font(.system(size: 13))
                            .foregroundStyle(DommiaTheme.textMuted)
                            .multilineTextAlignment(.center)
                            .padding(.horizontal, 32)
                    }
                    .padding(32)
                    .frame(maxWidth: .infinity)
                    .dommiaCard(cornerRadius: 20)
                    .padding(.horizontal, 16)
                } else {
                    VStack(spacing: 12) {
                        ForEach(passes) { pass in
                            passCard(pass)
                        }
                    }
                    .padding(.horizontal, 16)
                }

                Spacer(minLength: 24)
            }
        }
        .task {
            await loadPasses()
        }
        .sheet(isPresented: $showCreateModal) {
            QuickInviteModalView(invitationsService: invitationsService) { newPass in
                passes.insert(newPass, at: 0)
            }
        }
        .sheet(item: $selectedPassToShare) { pass in
            SharePassSheetView(pass: pass)
        }
        .alert("Revocar Pase", isPresented: $showRevokeAlert) {
            Button("Cancelar", role: .cancel) {}
            Button("Revocar Acceso", role: .destructive) {
                if let pass = passToRevoke {
                    Task { await revoke(pass: pass) }
                }
            }
        } message: {
            Text("¿Estás seguro de que deseas revocar el pase de \(passToRevoke?.visitorName ?? "la visita")? Ya no podrá acceder con este código QR.")
        }
    }

    private func passCard(_ pass: ResidentInvitation) -> some View {
        VStack(alignment: .leading, spacing: 14) {
            HStack {
                VStack(alignment: .leading, spacing: 2) {
                    Text(pass.visitorName)
                        .font(.system(size: 17, weight: .black))
                        .foregroundStyle(.white)

                    Text("Tipo: \(pass.passType)")
                        .font(.system(size: 12, weight: .medium))
                        .foregroundStyle(DommiaTheme.textMuted)
                }

                Spacer()

                Text("ACTIVO")
                    .font(.system(size: 10, weight: .bold))
                    .padding(.horizontal, 8)
                    .padding(.vertical, 4)
                    .background(DommiaTheme.emeraldBadge)
                    .clipShape(Capsule())
                    .foregroundStyle(DommiaTheme.emeraldLight)
            }

            Divider().background(DommiaTheme.border)

            HStack {
                Button {
                    selectedPassToShare = pass
                } label: {
                    HStack(spacing: 6) {
                        Image(systemName: "square.and.arrow.up")
                        Text("Compartir QR")
                    }
                    .font(.system(size: 12, weight: .bold))
                    .foregroundStyle(DommiaTheme.blueLight)
                    .padding(.horizontal, 12)
                    .padding(.vertical, 6)
                    .background(DommiaTheme.blueBadge)
                    .clipShape(RoundedRectangle(cornerRadius: 8))
                }
                .buttonStyle(.plain)

                Spacer()

                Button {
                    passToRevoke = pass
                    showRevokeAlert = true
                } label: {
                    Text("Revocar")
                        .font(.system(size: 12, weight: .bold))
                        .foregroundStyle(DommiaTheme.danger)
                        .padding(.horizontal, 10)
                        .padding(.vertical, 6)
                }
                .buttonStyle(.plain)
            }
        }
        .padding(16)
        .dommiaCard(cornerRadius: 20)
    }

    private func loadPasses() async {
        isLoading = true
        defer { isLoading = false }
        if let list = try? await invitationsService.list() {
            passes = list
        }
    }

    private func revoke(pass: ResidentInvitation) async {
        try? await invitationsService.revoke(id: pass.id)
        passes.removeAll { $0.id == pass.id }
    }
}

// Modal para crear nueva invitación
struct QuickInviteModalView: View {
    @Environment(\.dismiss) private var dismiss
    public let invitationsService: InvitationsService
    public let onCreated: (ResidentInvitation) -> Void

    @State private var visitorName = ""
    @State private var passType = "VISITOR"
    @State private var validDays = 1
    @State private var notes = ""
    @State private var isLoading = false
    @State private var error: String?

    var body: some View {
        NavigationStack {
            ZStack {
                DommiaTheme.surface
                    .ignoresSafeArea()

                ScrollView {
                    VStack(alignment: .leading, spacing: 20) {
                        VStack(alignment: .leading, spacing: 6) {
                            Text("Generar Pase de Visita")
                                .font(.system(size: 20, weight: .black))
                                .foregroundStyle(DommiaTheme.textPrimary)

                            Text("Crea un código QR de acceso rápido para tus visitantes.")
                                .font(.system(size: 13))
                                .foregroundStyle(DommiaTheme.textMuted)
                        }

                        VStack(alignment: .leading, spacing: 14) {
                            VStack(alignment: .leading, spacing: 6) {
                                Text("Nombre del Visitante")
                                    .font(.system(size: 13, weight: .bold))
                                    .foregroundStyle(DommiaTheme.textSecondary)

                                TextField("", text: $visitorName, prompt: Text("ej. María González").foregroundColor(DommiaTheme.placeholder))
                                    .dommiaTextField()
                            }

                            VStack(alignment: .leading, spacing: 6) {
                                Text("Tipo de Pase")
                                    .font(.system(size: 13, weight: .bold))
                                    .foregroundStyle(DommiaTheme.textSecondary)

                                Picker("Tipo", selection: $passType) {
                                    Text("Visita Regular").tag("VISITOR")
                                    Text("Servicio / Proveedor").tag("SERVICE")
                                    Text("Evento / Reunión").tag("EVENT")
                                }
                                .pickerStyle(.segmented)
                            }

                            VStack(alignment: .leading, spacing: 6) {
                                Text("Vigencia")
                                    .font(.system(size: 13, weight: .bold))
                                    .foregroundStyle(DommiaTheme.textSecondary)

                                Picker("Vigencia", selection: $validDays) {
                                    Text("1 Día").tag(1)
                                    Text("2 Días").tag(2)
                                    Text("Fin de semana (3d)").tag(3)
                                }
                                .pickerStyle(.segmented)
                            }

                            VStack(alignment: .leading, spacing: 6) {
                                Text("Notas para caseta (opcional)")
                                    .font(.system(size: 13, weight: .bold))
                                    .foregroundStyle(DommiaTheme.textSecondary)

                                TextField("", text: $notes, prompt: Text("ej. Placas ABC-1234").foregroundColor(DommiaTheme.placeholder))
                                    .dommiaTextField()
                            }
                        }

                        if let error {
                            Text(error)
                                .font(.system(size: 12))
                                .foregroundStyle(DommiaTheme.danger)
                        }

                        Button {
                            createPass()
                        } label: {
                            if isLoading {
                                ProgressView().tint(.white)
                            } else {
                                HStack {
                                    Text("Generar y Obtener QR")
                                        .font(.system(size: 15, weight: .bold))
                                    Image(systemName: "qrcode")
                                }
                            }
                        }
                        .frame(maxWidth: .infinity)
                        .frame(height: 50)
                        .background(DommiaTheme.primaryBlue)
                        .clipShape(RoundedRectangle(cornerRadius: 14))
                        .foregroundStyle(.white)
                        .disabled(visitorName.trimmingCharacters(in: .whitespaces).isEmpty || isLoading)

                        Spacer()
                    }
                    .padding(24)
                }
            }
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancelar") { dismiss() }
                        .foregroundStyle(DommiaTheme.textMuted)
                }
            }
        }
    }

    private func createPass() {
        isLoading = true
        error = nil
        Task {
            do {
                let req = CreateInvitationRequest(
                    visitorName: visitorName.trimmingCharacters(in: .whitespaces),
                    passType: passType,
                    validDays: validDays,
                    notes: notes.isEmpty ? nil : notes
                )
                let pass = try await invitationsService.create(req)
                onCreated(pass)
                dismiss()
            } catch {
                self.error = "No se pudo generar el pase."
                isLoading = false
            }
        }
    }
}

// Sheet para compartir pase
struct SharePassSheetView: View {
    @Environment(\.dismiss) private var dismiss
    public let pass: ResidentInvitation

    var body: some View {
        NavigationStack {
            ZStack {
                DommiaTheme.canvas
                    .ignoresSafeArea()

                VStack(spacing: 20) {
                    Text(pass.visitorName)
                        .font(.system(size: 22, weight: .black))
                        .foregroundStyle(.white)

                    Text("Pase de acceso con código QR generado")
                        .font(.system(size: 13))
                        .foregroundStyle(DommiaTheme.textMuted)

                    ZStack {
                        RoundedRectangle(cornerRadius: 20)
                            .fill(Color.white)
                            .frame(width: 220, height: 220)

                        if let qr = QRCodeHelper.generateQRCode(from: "dommia://qr/pass/\(pass.id)") {
                            Image(uiImage: qr)
                                .interpolation(.none)
                                .resizable()
                                .frame(width: 190, height: 190)
                        }
                    }

                    ShareLink(
                        item: "Pase de Acceso para \(pass.visitorName) en DOMMIA: dommia://qr/pass/\(pass.id)",
                        preview: SharePreview("Pase de Acceso \(pass.visitorName)")
                    ) {
                        HStack {
                            Image(systemName: "square.and.arrow.up")
                            Text("Compartir por WhatsApp o Mensaje")
                        }
                        .font(.system(size: 15, weight: .bold))
                        .frame(maxWidth: .infinity)
                        .frame(height: 50)
                        .background(DommiaTheme.primaryBlue)
                        .clipShape(RoundedRectangle(cornerRadius: 14))
                        .foregroundStyle(.white)
                    }
                    .padding(.horizontal, 24)

                    Spacer()
                }
                .padding(.top, 24)
            }
            .navigationTitle("Pase QR")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Listo") { dismiss() }
                        .foregroundStyle(DommiaTheme.blueLight)
                }
            }
        }
    }
}
