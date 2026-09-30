package com.dommia.resident.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Shapes
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.unit.dp

private val DommiaColors = darkColorScheme(
    primary = Primary,
    onPrimary = Color(0xFF06111F),
    primaryContainer = PrimaryContainer,
    onPrimaryContainer = TextPrimary,
    secondary = Secondary,
    onSecondary = Color(0xFF03131C),
    secondaryContainer = SecondaryContainer,
    onSecondaryContainer = TextPrimary,
    tertiary = Tertiary,
    onTertiary = Color(0xFF032016),
    background = Canvas,
    onBackground = TextPrimary,
    surface = Surface,
    onSurface = TextPrimary,
    surfaceVariant = SurfaceElevated,
    onSurfaceVariant = TextSecondary,
    error = Error,
    onError = Color(0xFF2B0505),
    errorContainer = ErrorContainer,
    onErrorContainer = Color(0xFFFECACA),
    outline = OutlineSubtle,
    outlineVariant = Color(0xFF1E293B),
)

private val DommiaShapes = Shapes(
    small = androidx.compose.foundation.shape.RoundedCornerShape(12.dp),
    medium = androidx.compose.foundation.shape.RoundedCornerShape(18.dp),
    large = androidx.compose.foundation.shape.RoundedCornerShape(24.dp),
    extraLarge = androidx.compose.foundation.shape.RoundedCornerShape(28.dp),
)

@Composable
fun DommiaResidentTheme(
    content: @Composable () -> Unit,
) {
    MaterialTheme(
        colorScheme = DommiaColors,
        typography = Typography,
        shapes = DommiaShapes,
        content = content,
    )
}
