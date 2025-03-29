import { ScriptHTMLAttributes } from 'react';

type ScriptProps = ScriptHTMLAttributes<HTMLScriptElement>;

export function Script (props: ScriptProps) {
    return (
        <>
            <script {...props} />
        </>
    );
}
