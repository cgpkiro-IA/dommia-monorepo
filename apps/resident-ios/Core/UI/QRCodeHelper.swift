import SwiftUI
import CoreImage.CIFilterBuiltins

public enum QRCodeHelper {
    private static let context = CIContext()

    public static func generateQRCode(from text: String) -> UIImage? {
        let filter = CIFilter.qrCodeGenerator()
        guard let data = text.data(using: .utf8) else { return nil }
        filter.setValue(data, forKey: "inputMessage")
        filter.setValue("M", forKey: "inputCorrectionLevel")

        guard let outputImage = filter.outputImage else { return nil }
        let transform = CGAffineTransform(scaleX: 10, y: 10)
        let scaledImage = outputImage.transformed(by: transform)

        guard let cgImage = context.createCGImage(scaledImage, from: scaledImage.extent) else { return nil }
        return UIImage(cgImage: cgImage)
    }
}
