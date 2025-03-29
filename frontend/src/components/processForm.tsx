import { BaseButton } from '@/components/button';
import { useEventListener } from '@/hooks/useEventListener';
import { useInitialiseClientState } from '@/hooks/useInitialiseClientState';
import { ApiProvider } from '@/providers/apiProvider';
import { sleep } from '@/utils/helpers';
import { tw } from '@/utils/style';

import type { SelectorFunc } from '@eleven-am/notifier/types';
import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useMemo, ReactNode, FormEvent, ChangeEvent, createContext, useContext, useEffect } from 'react';
import { IoArrowBack, IoArrowForward } from 'react-icons/io5';


interface BaseFormProps<Process extends string = string> {
    hideForm?: boolean;
    children?: ReactNode;
    error?: string | null;
    success?: string | null;
    className?: string;
    handleSubmit?: () => Promise<void | Process>;
}

interface BaseFormCustomValues {
    loading: boolean;
    isPrevious: boolean;
}

interface ProviderProps<Process extends string> {
    provider: FormProvider<ProcessState<Process>>;
    items: ProcessItemProps<Process>[];
    children: ReactNode;
    process?: Process;
}

interface ProcessForm {
    children: ReactNode;
    className?: string;
}

const formVariants = {
    enter: (customValues: BaseFormCustomValues) => ({
        opacity: customValues.loading ? 0 : 1,
        x: 100 * (customValues.isPrevious ? -1 : 1),
    }),
    center: (customValues: BaseFormCustomValues) => ({
        opacity: customValues.loading ? 0 : 1,
        x: 0,
    }),
    exit: (customValues: BaseFormCustomValues) => ({
        opacity: customValues.loading ? 0 : 1,
        x: 100 * (customValues.isPrevious ? 1 : -1),
    }),
};

export interface ProcessItemProps<Process extends string> {
    process: Process;
    item: ReactNode;
}

export interface ProcessState<Process extends string> {
    process: Process;
    loading: boolean;
    isPrevious: boolean;
    error: string | null;
    success: string | null;
    processHistory: Process[];
    processSequence: Process[];
    endProcess: Process;
    skippableProcesses: Process[];
}

export class FormProvider<State, Process extends string = string> extends ApiProvider<State & ProcessState<Process>> {
    setError (error: string | null) {
        this.#setState({
            error,
        });
    }

    setSuccess (success: string | null) {
        this.#setState({
            success,
        });
    }

    async processBack () {
        const processHistory = [...this.state.processHistory];
        const process = processHistory.pop();

        if (this.state.process.length < 2 || !process) {
            return;
        }

        this.load();
        await sleep(500);
        this.#setState({
            process: processHistory[processHistory.length - 1],
            processSequence: [process, ...this.state.processSequence],
            isPrevious: true,
            processHistory,
            error: null,
        });
        this.unload();
    }

    processForward (process: Process) {
        const processHistory: Process[] = [...this.state.processHistory];
        const previousSequence = [...this.state.processSequence];
        const sequence = previousSequence.filter((item) => item !== process);

        processHistory.push(process);

        this.#setState({
            process,
            processHistory,
            isPrevious: false,
            loading: false,
            processSequence: sequence,
        });
    }

    async nextProcess () {
        const nextProcess = this.state.processSequence[0];

        if (!nextProcess) {
            return;
        }

        this.load();
        await sleep(500);
        this.processForward(nextProcess);
        this.setError(null);
        this.unload();
    }

    setProcess (state: Process | null) {
        if (!state) {
            return;
        }

        this.#setState({
            process: state,
            loading: false,
            processHistory: [state],
            isPrevious: false,
            error: null,
            success: null,
        });
    }

    load () {
        this.#setState({
            loading: true,
        });
    }

    unload () {
        this.#setState({
            loading: false,
        });
    }

    #setState (state: Partial<ProcessState<Process>>) {
        this.updateState({
            ...state as Partial<State & ProcessState<Process>>,
        });
    }
}

interface Context {
    provider: FormProvider<ProcessState<string>>;
    items: ProcessItemProps<string>[];
    process: string | null;
}

const context = createContext<Context>({
    provider: new FormProvider({
        process: 'start',
        loading: false,
        isPrevious: false,
        error: null,
        success: null,
        skippableProcesses: [],
        processHistory: ['start'],
        processSequence: ['start'],
        endProcess: 'end',
    }),
    items: [],
    process: null,
});

function useFormContext () {
    const contextValue = useContext(context);

    if (!contextValue) {
        throw new Error('useFormContext must be used within a FormProvider');
    }

    return contextValue;
}

function useFormState <ReturnType> (selector?: SelectorFunc<ProcessState<string>, ReturnType>) {
    const { provider } = useFormContext();

    return provider.createStateHook()(selector);
}

function useFormActions () {
    const { provider } = useFormContext();

    return provider.createActionsHook()();
}

function Loader () {
    const loading = useFormState((state) => state.loading);

    return (
        <div
            className={
                tw('z-10 w-full h-full items-center justify-center fixed top-0 left-0 pointer-events-none', {
                    flex: loading,
                    hidden: !loading,
                })
            }
        >
            <div className={'loader text-darkM'} />
        </div>
    );
}

function FlashMessage () {
    const info = useFormState((state) => ({
        message: state.error || state.success,
        type: state.error ? 'error' : 'success',
    }));

    return (
        <div
            className={
                tw(
                    'absolute font-bold text-center top-16 mt-2 iphonePlus:mt-4 ipadMini:mt-2 macbook:pt-2 w-5/6 min-h-fit',
                    {
                        'text-green-500 ': info.type === 'success',
                        'text-red-500 ': info.type === 'error',
                    },
                )
            }
        >
            <span className={'text-sm iphonePlus:text-lg ipadMini:text-md imac:text-xl'}>
                {info.message}
            </span>
        </div>
    );
}

function BaseForm (props: BaseFormProps) {
    const { setError, setSuccess } = useFormActions();

    const { loading, isPrevious } = useFormState((state) => ({
        loading: state.loading,
        isPrevious: state.isPrevious,
    }));

    const handleSubmit = useCallback(async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (props.handleSubmit && !loading) {
            await props.handleSubmit();
        }
    }, [props, loading]);

    useEffect(() => {
        if (props.error) {
            setError(props.error);
        }

        if (props.success) {
            setSuccess(props.success);
        }
    }, [props.error, props.success, setError, setSuccess]);

    useEventListener('keydown', async (e: KeyboardEvent) => {
        if (e.key === 'Enter') {
            await handleSubmit(e as unknown as ChangeEvent<HTMLFormElement>);
        }
    });

    if (props.hideForm) {
        return (
            <motion.div
                variants={formVariants}
                className={'w-full h-full'}
                custom={
                    {
                        loading,
                        isPrevious,
                    }
                }
                initial={'enter'}
                animate={'center'}
                exit={'exit'}
            >
                {props.children}
            </motion.div>
        );
    }

    return (
        <form
            className={tw('h-3/5 w-5/6 transition-opacity duration-500 ease-in-out', props.className)}
            onSubmit={handleSubmit}
        >
            <motion.div
                variants={formVariants}
                custom={
                    {
                        loading,
                        isPrevious,
                    }
                }
                initial={'enter'}
                animate={'center'}
                exit={'exit'}
            >
                {props.children}
            </motion.div>
        </form>
    );
}

function PreviousButton () {
    const { processBack } = useFormActions();
    const { processes, process, endProcess } = useFormState((state) => ({
        processes: state.processHistory,
        process: state.process,
        endProcess: state.endProcess,
    }));

    const disabled = useMemo(() => processes.length < 2 || process === endProcess, [processes, process, endProcess]);

    return (
        <BaseButton
            disabled={disabled}
            onClick={processBack}
            title={'Previous step'}
            className={'absolute top-0 w-10 h-10 rounded-full p-2 m-4 flex items-center justify-center cursor-pointer border-2 border-lightM text-lightM transition-all duration-200 ease-in-out hover:border-lightest hover:text-lightest disabled:hidden'}
        >
            <IoArrowBack />
        </BaseButton>
    );
}

function NextButton () {
    const { nextProcess } = useFormActions();
    const enabled = useFormState((state) => state
        .skippableProcesses.includes(state.process) && state
        .processSequence.filter((process) => process !== state.endProcess).length > 0);

    return (
        <BaseButton
            disabled={!enabled}
            onClick={nextProcess}
            title={'Next step'}
            className={'absolute top-0 right-0 w-10 h-10 rounded-full p-2 m-4 flex items-center justify-center cursor-pointer border-2 border-lightM text-lightM transition-all duration-200 ease-in-out hover:border-lightest hover:text-lightest disabled:hidden'}
        >
            <IoArrowForward />
        </BaseButton>
    );
}

function ProcessItems () {
    const { items } = useFormContext();
    const { isPrevious, loading, process } = useFormState((state) => ({
        isPrevious: state.isPrevious,
        loading: state.loading,
        process: state.process,
    }));

    const item = useMemo(() => items.find((item) => item.process === process), [items, process]);

    return (
        <AnimatePresence
            initial={false}
            mode={'wait'}
            custom={
                {
                    isPrevious,
                    loading,
                }
            }
        >
            {item?.item}
        </AnimatePresence>
    );
}

function Form ({ children, className }: ProcessForm) {
    const { process } = useFormContext();
    const { setProcess } = useFormActions();

    useInitialiseClientState(setProcess, process);

    return (
        <>
            <div className={'flex items-center justify-center fixed top-0 left-0 w-full h-full'}>
                <div
                    className={'relative w-5/6 ipadMini:w-1/3 macbook:w-1/4 h-2/3 ipadMini:h-3/5 ipadPro:h-3/5 rounded-xl shadow-2xl backdrop-blur-lg border border-lightest'}
                >
                    <div className={tw('flex flex-col items-center justify-center h-full py-12', className)}>
                        {children}
                    </div>
                    <PreviousButton />
                    <NextButton />
                </div>
            </div>
            <Loader />
        </>
    );
}

export function ProcessForm <Process extends string> ({ children, items, provider, process }: ProviderProps<Process>) {
    const contextValue = useMemo(() => ({
        provider,
        items,
        process: process || null,
    }), [items, provider, process]);

    return (
        <context.Provider value={contextValue}>
            {children}
        </context.Provider>
    );
}

ProcessForm.Form = Form;
ProcessForm.Item = BaseForm;
ProcessForm.Items = ProcessItems;
ProcessForm.FlashMessage = FlashMessage;
