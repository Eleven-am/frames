import { HomeResponseTypes } from '@/api/data-contracts';
import { List } from '@/components/gridList';
import { HomeResponseSuspendable } from '@/components/index/homeResponseList';
import { HomeRecommendationTypes, indexQueries } from '@/queries';
import { weightedRandom } from '@/utils/helpers';
import { useCallback, useState, Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';

interface HomePicksProps {
    pickCount: {
        basic: number;
        editor: number;
    };
}

interface HomePicksState {
    type: HomeRecommendationTypes;
    count: number;
}

export function HomePicks ({ pickCount }: HomePicksProps) {
    const [loading, setLoading] = useState(false);
    const [segments, setSegments] = useState<HomePicksState[]>([]);
    const [editorCount, setEditorCount] = useState<number>(0);
    const [basicCount, setBasicCount] = useState<number>(0);
    const [recommendCount, setRecommendCount] = useState<number>(0);
    const addSegments = useCallback(() => {
        if (!loading) {
            setLoading(true);
            const string: HomePicksState[] = [];
            let [bas, edi, rec] = [basicCount, editorCount, recommendCount];

            while (string.length < 6) {
                const temp = weightedRandom({
                    basicPick: 0.27,
                    editorPick: 0.33,
                    recommend: 0.4,
                });

                switch (temp) {
                    case 'recommend':
                        rec++;
                        string.push({
                            type: HomeRecommendationTypes.RECOMMEND,
                            count: rec,
                        });
                        break;
                    case 'basicPick':
                        if (bas < pickCount.basic) {
                            bas++;
                            string.push({
                                type: HomeRecommendationTypes.BASIC,
                                count: bas,
                            });
                        }
                        break;
                    case 'editorPick':
                        if (edi < pickCount.editor) {
                            edi++;
                            string.push({
                                type: HomeRecommendationTypes.EDITOR,
                                count: edi,
                            });
                        }
                        break;
                    default:
                        break;
                }
            }

            setBasicCount(bas);
            setEditorCount(edi);
            setRecommendCount(rec);
            setSegments([...segments, ...string]);
            setLoading(false);
        }
    }, [basicCount, editorCount, loading, pickCount.basic, pickCount.editor, recommendCount, segments]);

    return (
        <List onEndReached={addSegments}>
            {
                segments.map((segment) => (
                    <ErrorBoundary
                        fallback={null}
                        key={`${segment.type}-${segment.count}`}
                    >
                        <Suspense
                            fallback={
                                <HomeResponseSuspendable.Skeleton
                                    type={
                                        segment.type === HomeRecommendationTypes.BASIC
                                            ? HomeResponseTypes.BASIC
                                            : HomeResponseTypes.EDITOR
                                    }
                                />
                            }
                        >
                            <HomeResponseSuspendable query={indexQueries.pickItem(segment.type, segment.count)} />
                        </Suspense>
                    </ErrorBoundary>
                ))
            }
        </List>
    );
}
