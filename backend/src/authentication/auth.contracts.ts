import { ApiProperty } from '@nestjs/swagger';
import { AuthenticatorTransportFuture, Base64URLString } from '@simplewebauthn/types';
import { Type } from 'class-transformer';
import {
    IsEmail,
    IsUUID,
    Matches,
    IsString,
    ValidateNested,
    IsOptional,
    IsEnum,
    IsArray,
    IsNumber,
    IsBoolean,
} from 'class-validator';


type Transport = 'ble' | 'cable' | 'hybrid' | 'internal' | 'nfc' | 'smart-card' | 'usb';

export class EmailParams {
    @IsEmail()
    @ApiProperty({
        description: 'The email address',
        format: 'email',
    })
    email: string;
}

export class PassKeyParams extends EmailParams {
    @ApiProperty({
        description: 'The username',
        minLength: 3,
        maxLength: 20,
    })
    @Matches(/^[a-zA-Z0-9_-]{3,20}$/, {
        message: 'Username must contain only letters, numbers, underscores, and hyphens',
    })
    username: string;

    @ApiProperty({
        description: 'The auth key',
        example: 'aXCv-3dFg-4HjK-5LmN-6PqR',
        minLength: 24,
        maxLength: 24,
    })
    @Matches(/^([a-zA-Z0-9]{4}-){4}[a-zA-Z0-9]{4}$/, {
        message: 'Auth key must be a valid key',
    })
    authKey: string;
}

export class UsernameParams {
    @ApiProperty({
        description: 'The username',
        minLength: 3,
        maxLength: 20,
    })
    @Matches(/^[a-zA-Z0-9_-]{3,20}$/, {
        message:
      'Username must contain only letters, numbers, underscores and hyphens',
    })
    username: string;
}

export class LoginParams extends EmailParams {
    @Matches(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+{}\[\]:;<>,.?~\\-]).{8,}$/,
        {
            message:
        'Password must contain at least 8 characters, one uppercase, one lowercase, one number and one special character',
        },
    )
    @ApiProperty({
        description:
      'Password must contain at least 8 characters, one uppercase, one lowercase and one number',
        minLength: 8,
        maxLength: 100,
        format: 'password',
    })
    password: string;
}

export class RegisterParams extends LoginParams {
    @ApiProperty({
        description: 'The username',
        minLength: 3,
        maxLength: 20,
    })
    @Matches(/^[a-zA-Z0-9_-]{3,20}$/, {
        message: 'Username must contain only letters, numbers, underscores, and hyphens',
    })
    username: string;

    @ApiProperty({
        description: 'The auth key',
        example: 'aXCv-3dFg-4HjK-5LmN-6PqR',
        minLength: 24,
        maxLength: 24,
    })
    @Matches(/^([a-zA-Z0-9]{4}-){4}[a-zA-Z0-9]{4}$/, {
        message: 'Auth key must be a valid key',
    })
    authKey: string;
}

export class ResetPasswordParams {
    @ApiProperty({
        description: 'The password reset token',
    })
    @IsUUID()
    token: string;

    @Matches(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+{}\[\]:;<>,.?~\\-]).{8,}$/,
        {
            message:
            'Password must contain at least 8 characters, one uppercase, one lowercase, one number and one special character',
        },
    )
    @ApiProperty({
        description:
          'Password must contain at least 8 characters, one uppercase, one lowercase and one number',
        minLength: 8,
        maxLength: 100,
        format: 'password',
    })
    password: string;
}

export class VerifyEmailParams {
    @ApiProperty({
        description: 'The email verification token',
    })
    @IsUUID()
    token: string;
}

export class ResetPasswordByEmailParams extends EmailParams {}

export class OauthCallbackQuery {
    @IsString()
    @ApiProperty({
        description: 'The OAuth code',
    })
    code: string;

    @IsString()
    @ApiProperty({
        description: 'The OAuth state',
    })
    state: string;
}

export class OauthAuthKeyBody {
    @IsString()
    @ApiProperty({
        description: 'The auth key',
    })
    authKey: string;

    @IsString()
    @IsUUID()
    @ApiProperty({
        description: 'The activation token',
    })
    token: string;
}

class AuthenticatorAssertionResponseValidator {
    @IsString()
    clientDataJSON: string;

    @IsString()
    authenticatorData: string;

    @IsString()
    signature: string;

    @IsString()
    @IsOptional()
    userHandle?: string;
}

class CredentialPropertiesOutputValidator {
    @IsOptional()
    @IsString()
    rk?: boolean;
}

class AuthenticationExtensionsClientOutputsValidator {
    @IsOptional()
    @IsString()
    appid?: boolean;

    @IsOptional()
    @ValidateNested()
    @Type(() => CredentialPropertiesOutputValidator)
    credProps?: CredentialPropertiesOutputValidator;

    @IsOptional()
    @IsString()
    hmacCreateSecret?: boolean;
}

class AuthenticatorAttestationResponseValidator {
    @IsString()
    clientDataJSON: string;

    @IsString()
    attestationObject: string;

    @IsOptional()
    @IsString()
    authenticatorData?: string;

    @IsOptional()
    @IsArray()
    @IsEnum(['ble', 'internal', 'nfc', 'usb', 'cable', 'hybrid'], { each: true })
    transports?: AuthenticatorTransportFuture[];

    @IsOptional()
    @IsNumber()
    publicKeyAlgorithm?: COSEAlgorithmIdentifier;

    @IsOptional()
    @IsString()
    publicKey?: string;
}

export class AuthenticationResponseValidator {
    @IsString()
    id: string;

    @IsString()
    rawId: string;

    @ValidateNested()
    @Type(() => AuthenticatorAssertionResponseValidator)
    response: AuthenticatorAssertionResponseValidator;

    @IsOptional()
    @IsEnum(['cross-platform', 'platform'])
    authenticatorAttachment?: 'cross-platform' | 'platform';

    @ValidateNested()
    @Type(() => AuthenticationExtensionsClientOutputsValidator)
    clientExtensionResults: AuthenticationExtensionsClientOutputsValidator;

    @IsEnum(['public-key'])
    type: 'public-key';
}

export class RegistrationResponseValidator {
    @IsString()
    id: string;

    @IsString()
    rawId: string;

    @ValidateNested()
    @Type(() => AuthenticatorAttestationResponseValidator)
    response: AuthenticatorAttestationResponseValidator;

    @IsOptional()
    @IsEnum(['cross-platform', 'platform'])
    authenticatorAttachment?: 'cross-platform' | 'platform';

    @ValidateNested()
    @Type(() => AuthenticationExtensionsClientOutputsValidator)
    clientExtensionResults: AuthenticationExtensionsClientOutputsValidator;

    @IsEnum(['public-key'])
    type: 'public-key';
}

export class ActivateWebAuthnParams {
    @IsBoolean()
    @ApiProperty({
        description: 'The activation status',
    })
    activated: boolean;
}

export class EmailResponseSchema {
    @ApiProperty({
        description: 'The email header',
        type: String,
    })
    header: string;

    @ApiProperty({
        description: 'The email message',
        type: String,
    })
    text: string;
}

class PublicKeyCredentialRpEntitySchema {
    @ApiProperty({
        description: 'The name of the relying party',
    })
    id: string;

    @ApiProperty({
        description: 'The name of the relying party',
    })
    name: string;
}

class PublicKeyCredentialUserEntityJSONSchema {
    @ApiProperty({
        description: 'The name of the user',
    })
    id: string;

    @ApiProperty({
        description: 'The name of the user',
    })
    name: string;

    @ApiProperty({
        description: 'The name of the user',
    })
    displayName: string;
}

class PublicKeyCredentialParametersSchema {
    @ApiProperty({
        description: 'The type of the public key',
    })
    type: string;

    @ApiProperty({
        description: 'The algorithm of the public key',
    })
    alg: number;
}

class PublicKeyCredentialDescriptorJSONSchema {
    @ApiProperty({
        description: 'The id of the public key',
    })
    id: string;

    @ApiProperty({
        description: 'The type of the public key',
        'enum': ['public-key'],
    })
    type: 'public-key';

    @ApiProperty({
        description: 'The transports of the public key',
        enumName: 'Transport',
        'enum': ['ble', 'cable', 'hybrid', 'internal', 'nfc', 'smart-card', 'usb'],
        isArray: true,
    })
    transports: Transport[];
}

class AuthenticatorSelectionCriteriaSchema {
    @ApiProperty({
        description: 'The authenticator attachment',
    })
    authenticatorAttachment: string;

    @ApiProperty({
        description: 'The resident key',
    })
    requireResidentKey: boolean;

    @ApiProperty({
        description: 'The user verification',
    })
    userVerification: string;

    @ApiProperty({
        description: 'The resident key',
    })
    residentKey: string;
}

class AuthenticationExtensionsClientInputsSchema {
    @ApiProperty({
        description: 'The appid',
    })
    appid?: string;

    @ApiProperty({
        description: 'The credential properties',
    })
    credProps?: boolean;

    @ApiProperty({
        description: 'The hmac create secret',
    })
    hmacCreateSecret?: boolean;

    @ApiProperty({
        description: 'The large blob',
    })
    minPinLength?: boolean;
}

export class PublicKeyCredentialCreationOptionsJSONSchema {
    @ApiProperty({
        description: 'The relying party',
        type: PublicKeyCredentialRpEntitySchema,
    })
    rp: PublicKeyCredentialRpEntitySchema;

    @ApiProperty({
        description: 'The user',
        type: PublicKeyCredentialUserEntityJSONSchema,
    })
    user: PublicKeyCredentialUserEntityJSONSchema;

    @ApiProperty({
        description: 'The challenge',
    })
    challenge: Base64URLString;

    @ApiProperty({
        description: 'The public key parameters',
        type: [PublicKeyCredentialParametersSchema],
    })
    pubKeyCredParams: PublicKeyCredentialParametersSchema[];

    @ApiProperty({
        description: 'The timeout',
    })
    timeout?: number;

    @ApiProperty({
        description: 'The excluded credentials',
        type: [PublicKeyCredentialDescriptorJSONSchema],
    })
    excludeCredentials?: PublicKeyCredentialDescriptorJSONSchema[];

    @ApiProperty({
        description: 'The authenticator selection',
        type: AuthenticatorSelectionCriteriaSchema,
    })
    authenticatorSelection?: AuthenticatorSelectionCriteriaSchema;

    @ApiProperty({
        description: 'The attestation',
    })
    attestation?: string;

    @ApiProperty({
        description: 'The extensions',
        type: AuthenticationExtensionsClientInputsSchema,
    })
    extensions?: AuthenticationExtensionsClientInputsSchema;
}

export class PublicKeyCredentialRequestOptionsJSONSchema {
    @ApiProperty({
        description: 'The challenge',
    })
    challenge: string;

    @ApiProperty({
        description: 'The timeout',
    })
    timeout?: number;

    @ApiProperty({
        description: 'The rp id',
    })
    rpId?: string;

    @ApiProperty({
        description: 'The allow credentials',
        type: [PublicKeyCredentialDescriptorJSONSchema],
    })
    allowCredentials?: PublicKeyCredentialDescriptorJSONSchema[];

    @ApiProperty({
        description: 'The user verification',
        enumName: 'UserVerification',
        'enum': ['required', 'preferred', 'discouraged'],
    })
    userVerification?: string;

    @ApiProperty({
        description: 'The extensions',
        type: AuthenticationExtensionsClientInputsSchema,
    })
    extensions?: AuthenticationExtensionsClientInputsSchema;
}
