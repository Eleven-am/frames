import {Component, ErrorInfo, ReactNode} from "react";
import Background from "./back";
import {ErrorPage} from "../production/person";

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

export default class ErrorBoundary extends Component<Props, State> {
    state: State;

    constructor(props: Props) {
        super(props);
        this.state = {hasError: false, error: null, errorInfo: null};
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        this.setState({hasError: true, error, errorInfo});
        console.error(error, errorInfo);
    }

    static getDerivedStateFromError(error: Error) {
        return {hasError: true, error, errorInfo: null};
    }

    render() {
        if (this.state.hasError)
            return (
                <>
                    <Background />
                    <ErrorPage error={{
                        name: 'An error occurred',
                        message: this.state.error?.message || 'Something went wrong'
                    }} />
                </>
            );

        return this.props.children;
    }
}
