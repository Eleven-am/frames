import { AuthKeyItemSchema, OauthClientSchema, Role, SlimFrontUserSchema } from '@/api/data-contracts';
import { OauthBaseButton, AuthButton } from '@/components/auth/buttons';
import { BaseButton } from '@/components/button';
import { Checkbox } from '@/components/checkbox';
import { CopyButton } from '@/components/framesButtons';
import { HoverElement } from '@/components/hoverElement';
import { BaseInput, MultiValueInput } from '@/components/input';
import { LazyImage } from '@/components/lazyImage';
import { Modal } from '@/components/modal';
import { FramesSelect } from '@/components/select';
import { BaseSection } from '@/components/settingsUI/baseSections';
import { Segment } from '@/components/settingsUI/segments';
import { Switch } from '@/components/switch';
import { DataTable } from '@/components/table';
import { MoreOptions } from '@/components/table/DataTableHeader';
import { Tags, TagItem } from '@/components/tags';
import { useClipboard } from '@/hooks/useCipboard';
import { useModalHook } from '@/hooks/useModalHook';
import { useNotificationState } from '@/providers/notificationChannel';
import { authActions } from '@/queries/auth';
import { accessMutations, accessQueries } from '@/queries/settings/access';
import { tw } from '@/utils/style';
import { useAction, usePrevious } from '@eleven-am/xquery';

import { CaretSortIcon } from '@radix-ui/react-icons';
import { useMutation, useQuery } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import { formatDistanceToNow } from 'date-fns';
import { useMemo, useState, useCallback, useEffect, FormEvent, ReactNode } from 'react';
import { BiSolidUserCircle } from 'react-icons/bi';
import { FaUsers, FaUserCheck } from 'react-icons/fa';
import { FaPlus } from 'react-icons/fa6';
import { MdOutlineViewAgenda, MdOutlineAdminPanelSettings } from 'react-icons/md';

import { RiShieldUserLine } from 'react-icons/ri';

import { TbReload, TbBrandOauth, TbLockOpen } from 'react-icons/tb';


interface OauthClientsDetailsProps {
    schema: OauthClientSchema;
    closeModal: () => void;
}

interface OauthClientDetailsProps {
    oauthClientId?: string;
    closeModal: () => void;
}

const defaultSchema: OauthClientSchema = {
    id: '',
    clientId: '',
    name: '',
    logo: '',
    tokenHost: '',
    tokenPath: '',
    scopes: [],
    userDataUrl: '',
    clientSecret: '',
    authorizeHost: '',
    authorizePath: '',
    color: '154,164,165,',
    buttonLabel: '',
    created: '',
    updated: '',
};

const columnDef: ColumnDef<AuthKeyItemSchema>[] = [
    {
        accessorKey: 'description',
        header: ({ column }) => (
            <BaseButton
                className={'flex items-center'}
                title={'Sort by description'}
                onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            >
                <span>Description</span>
                <CaretSortIcon className="ml-2 h-4 w-4" />
            </BaseButton>
        ),
        cell: ({ row }) => <div className="lowercase">{row.getValue('description')}</div>,
    },
    {
        accessorKey: 'key',
        header: ({ column }) => (
            <BaseButton
                title={'Sort by key'}
                className={'flex items-center'}
                onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            >
                <span>Key</span>
                <CaretSortIcon className="ml-2 h-4 w-4" />
            </BaseButton>
        ),
        cell: ({ row }) => <div className="lowercase">{(row.getValue('key') as string || '').slice(0, 5)}*******************</div>,
    },
    {
        accessorKey: 'case',
        enableColumnFilter: true,
        header: ({ column }) => (
            <BaseButton
                title={'Sort by case'}
                className={'flex items-center'}
                onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            >
                <span>Use Case</span>
                <CaretSortIcon className="ml-2 h-4 w-4" />
            </BaseButton>
        ),
        cell: ({ row }) => <div className="lowercase">{row.getValue('case')}</div>,
        filterFn: (row, columnId, filterValue) => filterValue.includes(row.getValue(columnId)) || !filterValue.length,
    },
    {
        accessorKey: 'date',
        header: ({ column }) => (
            <BaseButton
                title={'Sort by date'}
                className={'flex items-center'}
                onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            >
                <span>Date</span>
                <CaretSortIcon className="ml-2 h-4 w-4" />
            </BaseButton>
        ),
        cell: ({ row }) => (
            <div>
                {
                    formatDistanceToNow(new Date(row.getValue('date')), {
                        addSuffix: true,
                    })
                }
            </div>
        ),
    },
    {
        accessorKey: 'revoked',
        header: ({ column }) => (
            <BaseButton
                className={'flex items-center'}
                title={'Sort by revoked'}
                onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            >
                <span>Revoked</span>
                <CaretSortIcon className="ml-2 h-4 w-4" />
            </BaseButton>
        ),
        cell: ({ row }) => <Checkbox checked={row.getValue('revoked')} className={'cursor-default'} />,
    },
    {
        accessorKey: 'clipboard',
        header: () => null,
        cell: ({ row }) => <CopyButton
            title={'Copy auth key'}
            value={row.getValue('key')}
            successMessage={'Auth key copied to clipboard'}
            errorMessage={row.getValue('revoked') ? 'Auth key revoked' : undefined}
        />,
    },
];

const filterOptions = [
    {
        Component: (
            <>
                <MdOutlineAdminPanelSettings className={'w-5 h-5 mr-2'} />
                <span>Admins Users</span>
            </>
        ),
        value: Role.ADMIN,
    },
    {
        Component: (
            <>
                <FaUsers className={'w-5 h-5 mr-2'} />
                <span>Default Users</span>
            </>
        ),
        value: Role.USER,
    },
    {
        Component: (
            <>
                <TbBrandOauth className={'w-5 h-5 mr-2'} />
                <span>OAUTH Users</span>
            </>
        ),
        value: Role.OAUTH,
    },
];

function OauthClientDetails ({ schema, closeModal }: OauthClientsDetailsProps) {
    const [name, setName] = useState(schema.name);
    const [logo, setLogo] = useState(schema.logo);
    const [color, setColor] = useState(schema.color);
    const [clientId, setClientId] = useState(schema.clientId);
    const [tokenHost, setTokenHost] = useState(schema.tokenHost);
    const [tokenPath, setTokenPath] = useState(schema.tokenPath);
    const [scopes, setScopes] = useState<string[]>(schema.scopes);
    const [buttonLabel, setButtonLabel] = useState(schema.buttonLabel);
    const [userDataUrl, setUserDataUrl] = useState(schema.userDataUrl);
    const [clientSecret, setClientSecret] = useState(schema.clientSecret);
    const [authorizeHost, setAuthorizeHost] = useState(schema.authorizeHost);
    const [authorizePath, setAuthorizePath] = useState(schema.authorizePath);
    const { mutate: updateClient } = useMutation(accessMutations.updateOauthClient);
    const { mutate: createClient } = useMutation(accessMutations.createOauthClient);
    const { mutate: deleteClient } = useMutation(accessMutations.deleteOauthClient(closeModal));

    const { copy } = useClipboard();

    useEffect(() => {
        setName(schema.name);
        setLogo(schema.logo);
        setColor(schema.color);
        setScopes(schema.scopes);
        setClientId(schema.clientId);
        setTokenHost(schema.tokenHost);
        setTokenPath(schema.tokenPath);
        setButtonLabel(schema.buttonLabel);
        setUserDataUrl(schema.userDataUrl);
        setClientSecret(schema.clientSecret);
        setAuthorizeHost(schema.authorizeHost);
        setAuthorizePath(schema.authorizePath);
    }, [
        schema.authorizeHost,
        schema.authorizePath,
        schema.buttonLabel,
        schema.clientId,
        schema.clientSecret,
        schema.color,
        schema.logo,
        schema.name,
        schema.scopes,
        schema.tokenHost,
        schema.tokenPath,
        schema.userDataUrl,
    ]);

    const neeSchema = useMemo((): OauthClientSchema => ({
        id: schema.id,
        clientId,
        name,
        logo,
        color,
        buttonLabel,
        tokenHost,
        tokenPath,
        scopes,
        userDataUrl,
        clientSecret,
        authorizeHost,
        authorizePath,
        created: schema.created,
        updated: schema.updated,
    }), [
        authorizeHost,
        authorizePath,
        buttonLabel,
        clientId,
        clientSecret,
        color,
        logo,
        name,
        schema.created,
        schema.id,
        schema.updated,
        scopes,
        tokenHost,
        tokenPath,
        userDataUrl,
    ]);

    const handleSubmit = useCallback((event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (schema.id) {
            updateClient(neeSchema);
        } else {
            createClient(neeSchema);
        }
    }, [createClient, neeSchema, schema.id, updateClient]);

    const handleDelete = useCallback(() => deleteClient(schema.id), [deleteClient, schema.id]);

    const redirectUrl = useMemo(() => `${window.location.origin}/api/auth/${schema.id}/callback`, [schema.id]);

    const handleCopy = useCallback(() => copy(redirectUrl, 'Redirect url copied to clipboard'), [copy, redirectUrl]);

    return (
        <form
            className={'m-0 w-full px-4 justify-center items-center flex gap-x-4'}
            onSubmit={handleSubmit}
        >
            <div className={'flex flex-col w-full'}>
                <BaseInput
                    value={name}
                    placeholder={'enter the name of the client'}
                    onChange={setName}
                />
                <BaseInput
                    value={logo}
                    placeholder={'enter the logo of the client'}
                    onChange={setLogo}
                />
                <BaseInput
                    value={color}
                    placeholder={'enter the color of the client'}
                    onChange={setColor}
                />
                <BaseInput
                    value={buttonLabel}
                    placeholder={'enter the button label of the client'}
                    onChange={setButtonLabel}
                />
                <BaseInput
                    value={clientId}
                    placeholder={'enter the client id'}
                    onChange={setClientId}
                />
                <MultiValueInput
                    values={scopes}
                    placeholder={'enter the scopes'}
                    onChange={setScopes}
                />
                <AuthButton
                    type={'button'}
                    handleClick={handleCopy}
                    className={
                        tw('bg-darkM hover:bg-darkM/90 disabled:text-lightL disabled:bg-darkL/75', {
                            hidden: !schema.id,
                        })
                    }
                    label={'copy redirect url'}
                    tooltip={'copy redirect url'}
                />
                <OauthBaseButton
                    onColorChange={setColor}
                    client={
                        {
                            id: schema?.id || '',
                            buttonLabel,
                            color,
                            name,
                            logo,
                        }
                    }
                />
            </div>

            <div className={'flex flex-col w-full'}>
                <BaseInput
                    value={clientSecret}
                    placeholder={'enter the client secret'}
                    onChange={setClientSecret}
                />
                <BaseInput
                    value={tokenHost}
                    placeholder={'enter the token host'}
                    onChange={setTokenHost}
                />
                <BaseInput
                    value={tokenPath}
                    placeholder={'enter the token path'}
                    onChange={setTokenPath}
                />
                <BaseInput
                    value={authorizeHost}
                    placeholder={'enter the authorize host'}
                    onChange={setAuthorizeHost}
                />
                <BaseInput
                    value={authorizePath}
                    placeholder={'enter the authorize path'}
                    onChange={setAuthorizePath}
                />
                <BaseInput
                    value={userDataUrl}
                    placeholder={'enter the user data url'}
                    onChange={setUserDataUrl}
                />
                <AuthButton
                    type={'submit'}
                    className={'bg-darkM hover:bg-darkM/90 disabled:text-lightL disabled:bg-darkL/75'}
                    label={`${schema.id ? 'update' : 'create'} oauth client`}
                    tooltip={`${schema.id ? 'update' : 'create'} oauth client`}
                />
                <AuthButton
                    type={'button'}
                    handleClick={handleDelete}
                    className={
                        tw('bg-red-600 hover:bg-red-600/90 disabled:text-white/50 disabled:bg-red-300', {
                            hidden: !schema.id,
                        })
                    }
                    label={'delete oauth client'}
                    tooltip={'delete oauth client'}
                />
            </div>
        </form>
    );
}

function OauthClientDetail ({ oauthClientId, closeModal }: OauthClientDetailsProps) {
    const { data, isLoading } = useQuery(accessQueries.getOauthClientById(oauthClientId));
    const newData = useMemo(() => {
        if (oauthClientId && data && data.id === oauthClientId) {
            return data;
        }

        return defaultSchema;
    }, [data, oauthClientId]);

    if (isLoading || (oauthClientId && !data)) {
        return (
            <div className={'loader text-lightest'} />
        );
    }

    return (
        <OauthClientDetails schema={newData} closeModal={closeModal} />
    );
}

function CreateAuthKey () {
    const { mutate, data } = useMutation(accessMutations.createAuthKey);
    const previousData = usePrevious(data);
    const newData = useMemo(() => data || previousData, [data, previousData]);

    if (!newData) {
        return (
            <BaseButton
                onClick={mutate}
                title={'Create new auth key'}
            >
                Create new auth key
            </BaseButton>
        );
    }

    return (
        <div className={'flex items-center gap-x-3'}>
            <span>
                {newData.authKey.slice(0, 5)}*******************
            </span>
            <CopyButton
                value={newData.authKey}
                title={'Copy auth key'}
                successMessage={'Auth key copied to clipboard'}
            />
            <BaseButton
                onClick={mutate}
                title={'Generate new auth key'}
            >
                <TbReload className={'cursor-pointer w-6 h-6'} />
            </BaseButton>
        </div>
    );
}

function AuthKeyDetails () {
    const modalHook = useModalHook();
    const { data, isLoading } = useQuery(accessQueries.getAuthKeys);

    const { exhausted, notExhausted } = useMemo(() => {
        if (!data) {
            return {
                exhausted: 0,
                notExhausted: 0,
            };
        }

        const exhausted = data.results.filter((key) => key.revoked).length;
        const notExhausted = data.results.length - exhausted;

        return {
            exhausted,
            notExhausted,
        };
    }, [data]);

    if (isLoading) {
        return <span>Loading...</span>;
    }

    return (
        <div className={'flex h-full w-full items-center justify-between'}>
            <Tags
                tags={
                    [
                        {
                            tag: {
                                key: 'active',
                                value: notExhausted.toString(),
                            },
                        },
                        {
                            tag: {
                                key: 'revoked',
                                value: exhausted.toString(),
                            },
                        },
                    ]
                }
            />
            <BaseButton
                title={'View all auth keys'}
                onClick={modalHook.openModal}
            >
                <MdOutlineViewAgenda className={'cursor-pointer w-5 h-5'} />
            </BaseButton>
            <Modal
                open={modalHook.isOpen}
                onClose={modalHook.closeModal}
                className={'flex items-start justify-center w-2/3 h-4/5 overflow-hidden'}
            >
                <DataTable
                    columnKey={'case'}
                    data={data?.results ?? []}
                    columns={columnDef}
                />
            </Modal>
        </div>
    );
}

function OauthClientsDetails () {
    const modalHook = useModalHook();
    const [oauthClientId, setOauthClientId] = useState<string | undefined>(undefined);
    const { data, isLoading } = useQuery(accessQueries.getOauthClients);

    const handleEdit = useCallback((oauthClientId?: string) => {
        setOauthClientId(oauthClientId);
        modalHook.openModal();
    }, [modalHook]);

    const tags = useMemo(() => (data?.results || []).slice(0, 2)
        .map((client): TagItem => ({
            tag: client.name,
            onClick: () => handleEdit(client.id),
        }))
    , [data?.results, handleEdit]);

    if (isLoading) {
        return <span>Loading...</span>;
    }

    return (
        <div className={'flex h-full w-full items-center justify-between'}>
            <Tags tags={tags} />
            <BaseButton
                onClick={() => handleEdit()}
                title={'Create new oauth client'}
                disabled={(data?.results || []).length >= 2}
                className={'disabled:cursor-not-allowed disabled:pointer-events-none disabled:opacity-50'}
            >
                <FaPlus className={'cursor-pointer w-5 h-5'} />
            </BaseButton>
            <Modal
                open={modalHook.isOpen}
                onClose={modalHook.closeModal}
                className={'flex flex-col items-center justify-center overflow-hidden gap-y-6 py-4 w-11/12 ipadMini:w-2/3 h-2/3 px-4 bg-darkD/60 backdrop-blur-lg rounded-xl border-2 border-lightest shadow-black shadow-lg'}
            >
                <OauthClientDetail oauthClientId={oauthClientId} closeModal={modalHook.closeModal} />
            </Modal>
        </div>
    );
}

function UserCurrentDetails ({ data }: { data: SlimFrontUserSchema }) {
    const [hovered, setHovered] = useState(false);
    const metadata = useNotificationState((state) => state.users.find((user) => user.username === data.username)?.metadata || null);

    if (!metadata) {
        return (
            <Tags
                tags={
                    [
                        {
                            tag: {
                                key: 'watched',
                                value: data.watched.toString(),
                            },
                        },
                        {
                            tag: {
                                key: 'rated',
                                value: data.rated.toString(),
                            },
                        },
                        {
                            tag: {
                                key: 'watchList',
                                value: data.lists.toString(),
                            },
                        },
                    ]
                }
            />
        );
    }

    return (
        <HoverElement className={'flex items-center gap-x-1 h-10'} element={'div'} onHover={setHovered}>
            {
                hovered ?
                    <Tags
                        tags={
                            [
                                {
                                    tag: {
                                        key: 'watched',
                                        value: data.watched.toString(),
                                    },
                                },
                                {
                                    tag: {
                                        key: 'rated',
                                        value: data.rated.toString(),
                                    },
                                },
                                {
                                    tag: {
                                        key: 'watchList',
                                        value: data.lists.toString(),
                                    },
                                },
                            ]
                        }
                    /> :
                    <>
                        <LazyImage
                            src={metadata.backdrop}
                            alt={metadata.name}
                            className={'h-full w-auto object-contain rounded-md'}
                        />
                        <div className={'flex flex-col items-start justify-center'}>
                            <span>{metadata.action}</span>
                            <span>{metadata.name}</span>
                        </div>
                    </>
            }
        </HoverElement>
    );
}

function UserAccessDetails () {
    const modalHook = useModalHook();
    const { data, isLoading } = useQuery(accessQueries.getUsers);
    const { mutate: grantUsersAccess } = useMutation(accessMutations.grantUsersAccess);
    const { mutate: promoteUsers } = useMutation(accessMutations.promoteUsers);
    const { mutate: confirmUsers } = useMutation(accessMutations.confirmUsers);
    const { mutate: revokeUsers } = useMutation(accessMutations.revokeUsers);
    const { mutate: deleteUsers } = useMutation(accessMutations.deleteUsers);

    const { adminUsers, otherUsers } = useMemo(() => {
        const adminUsers = (data?.results ?? []).filter((user) => user.role === Role.ADMIN).length;
        const otherUsers = (data?.results || []).length - adminUsers;

        return {
            adminUsers,
            otherUsers,
        };
    }, [data?.results]);

    const toggleRevoked = useCallback((user: SlimFrontUserSchema) => () => {
        if (user.revoked) {
            grantUsersAccess([user.userId]);
        } else {
            revokeUsers([user.userId]);
        }
    }, [grantUsersAccess, revokeUsers]);

    const handleConfirmed = useCallback((user: SlimFrontUserSchema) => () => confirmUsers([user.userId]), [confirmUsers]);

    const handleRoleChange = useCallback((user: SlimFrontUserSchema) => (role: string) => promoteUsers({
        userIds: [user.userId],
        role: role as Role,
    }), [promoteUsers]);

    const columns = useMemo((): ColumnDef<SlimFrontUserSchema>[] => [
        {
            id: 'select',
            header: ({ table }) => (
                <Checkbox
                    checked={
                        table.getIsAllPageRowsSelected() ||
                        (table.getIsSomePageRowsSelected() && 'indeterminate')
                    }
                    onCheckedChange={(value) => table.toggleAllPageRowsSelected(Boolean(value))}
                    aria-label="Select all"
                />
            ),
            cell: ({ row }) => (
                <Checkbox
                    checked={row.getIsSelected()}
                    onCheckedChange={(value) => row.toggleSelected(Boolean(value))}
                    aria-label="Select row"
                />
            ),
            enableSorting: false,
            enableHiding: false,
        },
        {
            accessorKey: 'username',
            header: ({ column }) => (
                <BaseButton
                    className={'flex items-center'}
                    title={'Sort by username'}
                    onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                >
                    <span>Username</span>
                    <CaretSortIcon className="ml-2 h-4 w-4" />
                </BaseButton>
            ),
            cell: ({ row }) => <div className="lowercase">{row.getValue('username')}</div>,
        },
        {
            accessorKey: 'role',
            header: ({ column }) => (
                <BaseButton
                    className={'flex items-center'}
                    title={'Sort by role'}
                    onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                >
                    <span>Role</span>
                    <CaretSortIcon className="ml-2 h-4 w-4" />
                </BaseButton>
            ),
            cell: ({ row }) => (
                <FramesSelect
                    options={[Role.ADMIN, Role.USER, Role.OAUTH]}
                    value={row.getValue('role') as Role}
                    onChange={handleRoleChange(row.original)}
                />
            ),
        },
        {
            accessorKey: 'confirmed',
            header: ({ column }) => (
                <BaseButton
                    className={'flex items-center'}
                    title={'Sort by confirmed'}
                    onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                >
                    <span>Confirmed</span>
                    <CaretSortIcon className="ml-2 h-4 w-4" />
                </BaseButton>
            ),
            cell: ({ row }) => <Checkbox checked={row.getValue('confirmed')}
                onCheckedChange={handleConfirmed(row.original)}
                className={
                    tw('cursor-pointer', {
                        'cursor-default pointer-events-none': row.original.confirmed,
                    })
                }
            />,
        },
        {
            accessorKey: 'revoked',
            header: ({ column }) => (
                <BaseButton
                    className={'flex items-center'}
                    title={'Sort by revoked'}
                    onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                >
                    <span>Revoked</span>
                    <CaretSortIcon className="ml-2 h-4 w-4" />
                </BaseButton>
            ),
            cell: ({ row }) => <Checkbox checked={row.getValue('revoked')} onCheckedChange={toggleRevoked(row.original)} />,
        },
        {
            accessorKey: 'details',
            header: () => (
                <BaseButton
                    className={'flex items-center'}
                    title={'Sort by details'}
                >
                    <span>Details</span>
                </BaseButton>
            ),
            cell: ({ row }) => <UserCurrentDetails data={row.original} />,
        },
        {
            accessorKey: 'created',
            header: ({ column }) => (
                <BaseButton
                    className={'flex items-center'}
                    title={'Sort by created'}
                    onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                >
                    <span>Created</span>
                    <CaretSortIcon className="ml-2 h-4 w-4" />
                </BaseButton>
            ),
            cell: ({ row }) => (
                <div className="lowercase">
                    {
                        formatDistanceToNow(new Date(row.getValue('created')), {
                            addSuffix: true,
                        })
                    }
                </div>
            ),
        },
    ], [handleConfirmed, handleRoleChange, toggleRevoked]);

    const options = useMemo((): MoreOptions<SlimFrontUserSchema>[] => [
        {
            key: 'revoke',
            Component: (
                <>
                    <TbLockOpen className={'w-5 h-5 mr-2'} />
                    <span>Revoke access</span>
                </>
            ),
            onClick: (selected) => revokeUsers(selected.map((user) => user.userId)),
        },
        {
            key: 'gran-access',
            Component: (
                <>
                    <TbLockOpen className={'w-5 h-5 mr-2'} />
                    <span>Grant access</span>
                </>
            ),
            onClick: (selected) => grantUsersAccess(selected.map((user) => user.userId)),
        },
        {
            key: 'confirm',
            Component: (
                <>
                    <FaUserCheck className={'w-5 h-5 mr-2'} />
                    <span>Confirm access</span>
                </>
            ),
            onClick: (selected) => confirmUsers(selected.map((user) => user.userId)),
        },
        {
            key: 'promote',
            Component: (
                <>
                    <RiShieldUserLine className={'w-5 h-5 mr-2'} />
                    <span>Promote to admin</span>
                </>
            ),
            onClick: (selected) => promoteUsers({
                userIds: selected.map((user) => user.userId),
                role: Role.ADMIN,
            }),
        },
        {
            key: 'demote',
            Component: (
                <>
                    <BiSolidUserCircle className={'w-5 h-5 mr-2'} />
                    <span>Downgrade to user</span>
                </>
            ),
            onClick: (selected) => promoteUsers({
                userIds: selected.map((user) => user.userId),
                role: Role.USER,
            }),
        },
    ], [confirmUsers, grantUsersAccess, promoteUsers, revokeUsers]);

    const handleDelete = useCallback((selected: SlimFrontUserSchema[]) => deleteUsers(selected.map((user) => user.userId)), [deleteUsers]);

    if (isLoading) {
        return <span>Loading...</span>;
    }

    return (
        <div className={'flex h-full w-full items-center justify-between'}>
            <Tags
                tags={
                    [
                        {
                            tag: {
                                key: 'admin',
                                value: adminUsers.toString(),
                            },
                        },
                        {
                            tag: {
                                key: 'users',
                                value: otherUsers.toString(),
                            },
                        },
                    ]
                }
            />
            <BaseButton
                title={'View all users'}
                onClick={modalHook.openModal}
            >
                <MdOutlineViewAgenda className={'cursor-pointer w-5 h-5'} />
            </BaseButton>
            <Modal
                open={modalHook.isOpen}
                onClose={modalHook.closeModal}
                className={'flex items-start justify-center w-3/4 h-4/5 overflow-hidden'}
            >
                <DataTable
                    columns={columns}
                    columnKey={'role'}
                    data={data?.results ?? []}
                    onDeletion={handleDelete}
                    filters={filterOptions}
                    elements={options}
                />
            </Modal>
        </div>
    );
}

function ManagementSection ({ children, label, className }: { children: ReactNode, label: string, className?: string }) {
    return (
        <Segment.Container className={tw('mb-2 shadow-black/50 shadow-md', className)}>
            <Segment className={'justify-between'}>
                <h3 className={'fullHD:text-lg font-semibold line-clamp-1 text-nowrap'}>
                    {label}
                </h3>
            </Segment>
            <Segment className={'justify-between'} isLast={true}>
                {children}
            </Segment>
        </Segment.Container>
    );
}

export function Access () {
    const { data: enabled, mutate } = useAction(authActions.webAuthnStatus);

    return (
        <div className={'flex flex-col w-full ipadMini:w-1/2 gap-y-8'}>
            <BaseSection
                label={'Users access & authentication'}
                className={'shadow-black/50 shadow-md'}
                settings={
                    [
                        {
                            label: 'Create new auth key',
                            rightElement: <CreateAuthKey />,
                        },
                        {
                            label: 'Activate webauthn (PassKey)',
                            rightElement: <Switch isSelected={enabled} onChange={mutate} />,
                        },
                    ]
                }
            />
            <Segment.Section>
                <Segment.FlexWrapper className={'gap-y-6'}>
                    <ManagementSection label={'Manage auth keys'}>
                        <AuthKeyDetails />
                    </ManagementSection>
                    <ManagementSection label={'Manage oauth clients'}>
                        <OauthClientsDetails />
                    </ManagementSection>
                    <ManagementSection label={'Manage authorized users'}>
                        <UserAccessDetails />
                    </ManagementSection>
                </Segment.FlexWrapper>
            </Segment.Section>
        </div>
    );
}

