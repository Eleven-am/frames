import { BaseButton, DropDownButton, DropdownMenu } from '@/components/button';
import { BaseInput } from '@/components/input';
import { useClipboard } from '@/hooks/useCipboard';
import { useGroupWatch, useGroupWatchActions } from '@/providers/groupWatch';
import { usePlayerUIActions } from '@/providers/watched/playerUI';
import { createStylesFromSeed } from '@/utils/colour';
import { tw } from '@/utils/style';

import { sortBy } from '@eleven-am/fp';
import { formatDistanceToNow } from 'date-fns';
import { AnimatePresence, motion } from 'framer-motion';
import { useMemo, useState, useCallback, ReactNode } from 'react';
import { AiOutlineLink } from 'react-icons/ai';
import { BsEmojiSmile } from 'react-icons/bs';
import { FaRegUser } from 'react-icons/fa';
import { FiLogOut } from 'react-icons/fi';
import { IoMdCloseCircle } from 'react-icons/io';
import { IoSend } from 'react-icons/io5';
import { LuUsers } from 'react-icons/lu';

interface MessageProps {
    message: string;
    username: string;
    self: boolean;
    time: number;
}

interface SideBarProps {
    children: ReactNode;
}

interface EmojiEvent {
    id: string;
    keywords: string[];
    name: string;
    native: string;
    shortcodes: string[];
    unified: string;
}

const childrenVariant = {
    narrow: {
        width: '70%',
        transition: {
            ease: 'easeIn',
            duration: 0.15,
        },
    },
    wide: {
        width: '100%',
        transition: {
            ease: 'easeIn',
            duration: 0.15,
        },
    },
};

const chatVariant = {
    'in': {
        x: 0,
        transition: {
            ease: 'easeIn',
            duration: 0.15,
        },
    },
    out: {
        x: '100%',
        transition: {
            ease: 'easeIn',
            duration: 0.15,
        },
    },
};

const categories = [
    'frequent',
    'people',
    'nature',
    'foods',
    'activity',
    'places',
    'objects',
    'symbols',
    'flags',
];

export function Message ({ message, username, self, time }: MessageProps) {
    return (
        <div
            className={
                tw('w-full p-2 flex items-start', {
                    'justify-end': self,
                    'justify-start': !self,
                })
            }
        >
            {
                !self && (
                    <div
                        style={createStylesFromSeed(username, [4, 7])}
                        className={'w-8 h-8 justify-center items-center flex rounded-full text-lg font-bold text-light-400 bg-dark-700'}
                    >
                        {username.charAt(0).toUpperCase()}
                    </div>
                )
            }
            <div
                className={
                    tw('mx-2 max-w-[70%] flex flex-col gap-y-1', {
                        'items-end': self,
                        'items-start': !self,
                    })
                }
            >
                <span className={'text-lightest/50 text-xs font-bold'}>
                    {username}
                </span>
                <div
                    className={
                        tw('text-sm px-2 py-1 rounded-md text-lightest', {
                            'bg-darkM/60': self,
                            'bg-lightM/60': !self,
                        })
                    }
                >
                    {message}
                </div>
                <span className={'text-lightest/50 text-xs font-bold'}>
                    {
                        formatDistanceToNow(time, {
                            addSuffix: true,
                        })
                    }
                </span>
            </div>
        </div>
    );
}

export function SideBar ({ children }: SideBarProps) {
    const { copy } = useClipboard();
    const [message, setMessage] = useState('');
    const { setFullScreenElement } = usePlayerUIActions();
    const { evictUser, endSession, toggleChat, broadcastMessage } = useGroupWatchActions();
    const handleEmojiClick = useCallback((emoji: EmojiEvent) => setMessage((prev) => `${prev}${emoji.native}`), []);

    const { users, isChatOpen, messages, watchParty } = useGroupWatch((state) => ({
        users: state.users,
        messages: sortBy(state.messageHistory, 'time', 'asc'),
        isChatOpen: state.isChatOpen,
        watchParty: state.channel,
    }));

    const elements = useMemo(() => users
        .map((user) => ({
            key: user.browserId,
            onClick: () => evictUser(user),
            title: `Evict ${user.username}`,
            Component: (
                <>
                    <FaRegUser className={'w-5 h-5'} strokeWidth={3} />
                    <span className={'ml-3'}>{user.username}</span>
                </>
            ),
        })), [evictUser, users]);

    const handleCopy = useCallback(() => {
        const host = window.location.host;
        const url = `${host}/${watchParty?.replace(/rooms\//, 'r=')}`;

        copy(url, 'Link copied to clipboard');
    }, [copy, watchParty]);

    const handleSendMessage = useCallback(() => {
        broadcastMessage(message);
        setMessage('');
    }, [broadcastMessage, message]);

    return (
        <div className={'w-full h-full bg-black'} ref={setFullScreenElement}>
            <AnimatePresence initial={false}>
                <motion.div
                    className={'w-full h-full'}
                    key={'children'}
                    initial={'wide'}
                    variants={childrenVariant}
                    animate={isChatOpen ? 'narrow' : 'wide'}
                >
                    {children}
                </motion.div>
                {
                    isChatOpen && (
                        <motion.div
                            key={'chat'}
                            initial={'out'}
                            variants={chatVariant}
                            animate={isChatOpen ? 'in' : 'out'}
                            className={'fixed flex flex-col bg-darkD/60 backdrop-blur-lg top-0 right-0 h-full w-[30%] p-4 gap-y-4'}
                        >
                            <div
                                className={'flex items-center justify-between h-14 w-full px-4 py-2 bg-darkL/20 shadow-md rounded-md'}
                            >
                                <span
                                    className={'text-lightest text-shadow-sm shadow-black text-2xl font-bold'}
                                >
                                    Watch Party
                                </span>
                                <div className={'flex items-center justify-end gap-x-4'}>
                                    <BaseButton
                                        onClick={toggleChat}
                                        title={'Close chat'}
                                        className={'hover:scale-125 transition-all duration-300 ease-in-out'}
                                    >
                                        <IoMdCloseCircle className={'w-6 h-6 text-lightest'} strokeWidth={2} />
                                    </BaseButton>
                                    <BaseButton
                                        onClick={handleCopy}
                                        title={'Copy party link'}
                                        className={'hover:scale-125 transition-all duration-300 ease-in-out'}
                                    >
                                        <AiOutlineLink className={'w-6 h-6 text-lightest'} />
                                    </BaseButton>
                                    <DropDownButton
                                        count={2}
                                        counterClassName={'-mt-2'}
                                        Content={<LuUsers className={'w-6 h-6 text-lightest'} strokeWidth={2} />}
                                    >
                                        <DropdownMenu elements={elements} />
                                    </DropDownButton>
                                    <BaseButton
                                        onClick={endSession}
                                        title={'End session'}
                                        className={'hover:scale-125 transition-all duration-300 ease-in-out'}
                                    >
                                        <FiLogOut className={'w-6 h-6 text-lightest'} strokeWidth={2} />
                                    </BaseButton>
                                </div>
                            </div>
                            <div
                                className={'flex-grow flex-col rounded-md border border-lightest/10 overflow-hidden overflow-y-scroll scrollbar-hide'}
                            >
                                {
                                    messages.map((message) => (
                                        <Message
                                            key={message.time}
                                            message={message.message}
                                            username={message.username}
                                            self={message.self}
                                            time={message.time}
                                        />
                                    ))
                                }
                            </div>
                            <div className={'relative flex justify-center items-center h-14'}>
                                <BaseInput
                                    type={'text'}
                                    value={message}
                                    placeholder={'This is a placeholder'}
                                    className={'text-sm placeholder:text-sm py-1'}
                                    holderClassName={'grow flex flex-row mb-0 macbook:mb-0 items-center'}
                                    onChange={setMessage}
                                    onKeyDown={
                                        (e) => {
                                            e.code === 'Space' ? e.stopPropagation() : null;
                                        }
                                    }
                                />
                                <div className={'flex h-full items-center mx-3 gap-x-3'}>
                                    <DropDownButton
                                        Content={<BsEmojiSmile className={'w-6 h-6 text-lightest/50 hover:text-lightest transition-all duration-300 ease-in-out'} />}
                                    >
                                        {/*<Picker
                                            data={data}
                                            categories={categories}
                                            onEmojiSelect={handleEmojiClick}
                                            previewPosition="none"
                                        />*/}
                                        hello
                                    </DropDownButton>
                                    <BaseButton
                                        title={'Send message'}
                                        onClick={handleSendMessage}
                                    >
                                        <IoSend
                                            className={'w-6 h-6 text-lightest/50 hover:text-lightest transition-all duration-300 ease-in-out'}
                                            strokeWidth={3}
                                        />
                                    </BaseButton>
                                </div>
                            </div>
                        </motion.div>
                    )
                }
            </AnimatePresence>
        </div>
    );
}
