declare module "react-simple-maps" {
  import { ComponentType, CSSProperties, ReactNode } from "react";

  export interface ComposableMapProps {
    projection?: string;
    projectionConfig?: {
      scale?: number;
      center?: [number, number];
      rotate?: [number, number, number];
    };
    width?: number;
    height?: number;
    style?: CSSProperties;
    className?: string;
    children?: ReactNode;
  }

  export interface GeographiesProps {
    geography: string | object;
    children: (args: { geographies: GeoFeature[] }) => ReactNode;
  }

  export interface GeoFeature {
    rsmKey: string;
    properties: Record<string, string | number | null>;
    [key: string]: unknown;
  }

  export interface GeographyStyleProps {
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
    fillOpacity?: number;
    outline?: string;
    cursor?: string;
  }

  export interface GeographyProps {
    geography: GeoFeature;
    onClick?: (geo: GeoFeature, evt: React.MouseEvent) => void;
    onMouseEnter?: (geo: GeoFeature, evt: React.MouseEvent) => void;
    onMouseLeave?: (geo: GeoFeature, evt: React.MouseEvent) => void;
    style?: {
      default?: GeographyStyleProps;
      hover?: GeographyStyleProps;
      pressed?: GeographyStyleProps;
    };
    className?: string;
  }

  export const ComposableMap: ComponentType<ComposableMapProps>;
  export const Geographies: ComponentType<GeographiesProps>;
  export const Geography: ComponentType<GeographyProps>;
  export const ZoomableGroup: ComponentType<{
    center?: [number, number];
    zoom?: number;
    children?: ReactNode;
  }>;
  export const Marker: ComponentType<{
    coordinates: [number, number];
    children?: ReactNode;
  }>;
}
