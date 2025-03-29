export interface Language {
    English: string;
    alpha2: string;
    countries: string[];
    defaultCountry: string | null;
}

export interface StoreFront {
    countryCode: string;
    languageCode: string;
    storeFrontId: number;
}

export interface Country {
    name: string;
    alpha2: string;
    englishName: string | null;
    frenchName: string | null;
    capital: string;
    currency: string;
    currencyName: string;
    languages: string[];
}

export interface LanguageReturn {
    languageName: string;
    languageCode: string;
    countryCode: string;
    countryName: string;
    alpha2: string;
    storeFronts: StoreFront[];
    defaultObject: () => LanguageReturn;
}
