export const PDF_STYLES = {
  colors: {
    primary: [0, 122, 255],
    secondary: [45, 156, 219],
    success: [52, 199, 89],
    text: {
      dark: [33, 33, 33],
      light: [255, 255, 255],
      muted: [128, 128, 128]
    },
    background: {
      stripe: [249, 250, 251]
    }
  },
  fonts: {
    heading: {
      size: 28,
      color: [255, 255, 255]
    },
    subheading: {
      size: 16,
      color: [255, 255, 255]
    },
    section: {
      size: 14,
      color: [33, 33, 33]
    }
  },
  spacing: {
    margin: 20,
    padding: 10
  },
  gradients: {
    header: {
      colors: [
        [41, 128, 185],
        [109, 213, 237]
      ],
      coordinates: {
        x1: 0, y1: 0,
        x2: 210, y2: 60
      }
    }
  }
};

export const TABLE_STYLES = {
  header: {
    fillColor: [...PDF_STYLES.colors.primary],
    textColor: 255,
    fontSize: 10,
    fontStyle: 'bold',
    halign: 'left'
  },
  cell: {
    fontSize: 9,
    cellPadding: 5,
    lineColor: [240, 240, 240]
  },
  alternateRow: {
    fillColor: [...PDF_STYLES.colors.background.stripe]
  }
};