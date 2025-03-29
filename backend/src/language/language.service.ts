import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';


import countriesJSON from './data/countries.json';
import languagesJSON from './data/languages.json';
import storeFrontsJSON from './data/storeFronts.json';
import { NO_LANGUAGE } from './language.constants';
import { Language, StoreFront, Country, LanguageReturn } from './language.types';
import { DEFAULT_LANGUAGE } from '../config/constants';

const languages = languagesJSON as Language[];
const storeFronts = storeFrontsJSON as StoreFront[];
const countries = countriesJSON as Country[];

@Injectable()
export class LanguageService {
    private readonly language: LanguageReturn;

    constructor (private readonly configService: ConfigService) {
        const language = this.configService.get<string>(DEFAULT_LANGUAGE) || 'en-US';
        const returnLanguage = this.buildLanguage(language);

        if (!returnLanguage) {
            throw new Error('Language not found');
        }

        this.language = returnLanguage;
    }

    get defaultLanguage () {
        return this.language;
    }

    getLanguage (language: string) {
        const buildFromNameResult = this.buildFromName(language);

        if (buildFromNameResult) {
            return buildFromNameResult;
        }

        const buildLanguageResult = this.buildLanguage(language);

        if (buildLanguageResult) {
            return buildLanguageResult;
        }

        return this.language;
    }

    languageExists (language: string) {
        return Boolean(this.buildLanguage(language)) || Boolean(this.buildFromName(language));
    }

    getAvailableLanguages () {
        return Array.from(new Set([NO_LANGUAGE].concat(languages.map((l) => l.English).sort())));
    }

    private buildLanguage (language: string) {
        const [alpha2, country] = language.split('-');
        const languageObj = languages.find((l) => l.alpha2 === alpha2);

        if (languageObj) {
            const countryObj = countries.find((c) => c.alpha2 === country);

            if (countryObj) {
                return {
                    languageName: languageObj.English,
                    languageCode: languageObj.alpha2,
                    countryCode: countryObj.alpha2,
                    alpha2: `${languageObj.alpha2}-${countryObj.alpha2}`,
                    countryName: countryObj.englishName || countryObj.name,
                    storeFronts: storeFronts.filter((storeFront) => storeFront.languageCode === languageObj.alpha2),
                    defaultObject: () => this.language,
                } as LanguageReturn;
            }
        }

        return null;
    }

    private buildFromName (language: string) {
        if (language === NO_LANGUAGE) {
            return this.identity();
        }

        const languageObj = languages.find((l) => l.English === language);

        if (languageObj) {
            const defaultCountry = languageObj.defaultCountry || this.language.countryCode;
            const countryObj = countries.find((c) => c.alpha2 === defaultCountry);

            if (countryObj) {
                return {
                    languageName: languageObj.English,
                    languageCode: languageObj.alpha2,
                    countryCode: countryObj.alpha2,
                    alpha2: `${languageObj.alpha2}-${countryObj.alpha2}`,
                    countryName: countryObj.englishName || countryObj.name,
                    storeFronts: storeFronts.filter((storeFront) => storeFront.languageCode === languageObj.alpha2),
                    defaultObject: () => this.language,
                } as LanguageReturn;
            }
        }

        return null;
    }

    private identity () {
        return {
            languageName: NO_LANGUAGE,
            languageCode: 'N/A',
            countryCode: 'N/A',
            alpha2: 'N/A',
            countryName: 'N/A',
            storeFronts: [],
            defaultObject: () => this.language,
        } as LanguageReturn;
    }
}
