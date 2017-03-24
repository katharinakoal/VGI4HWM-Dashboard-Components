export interface IRawMediaData {
    uuid: string;           // Eindeutige unveränderliche ID
    timestamp: string;      // Zeitpunkt codiert im ISO_8601 Format
    location: ILocation;
    images: IMediaElement[] | null;
    videos: IMediaElement[] | null;
    categories: IMediaCategory[];
}

interface ILocation {
    lat: number;    // Latitude als Dezimalwert
    lng: number;    // Longitude als Dezimalwert
}

interface IMediaElement {
    url: string;            // Absolute URL
    thumbnail_url: string;  // Absolute URL zur Miniaturansicht
    title?: string;          // Bild- oder Videotitel
    caption?: string;        // Bild- oder Videobeschreibung
}

interface IMediaCategory {
    id: number;
    shortname: string;  // Kurzbezeichnung, maximal 40 Zeichen
    longname: string;   // Langbezeichnung, maximal 255 Zeichen
}
