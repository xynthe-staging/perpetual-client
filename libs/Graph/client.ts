import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client';
import { createNetworkStatusNotifier } from 'react-apollo-network-status';

const { link, useApolloNetworkStatus } = createNetworkStatusNotifier();

const useGlobalLoadingState: () => boolean = () => {
    const status = useApolloNetworkStatus();
    return status.numPendingQueries + status.numPendingMutations > 0;
};

const ApolloWrapper: (uri: string) => ApolloClient<any> | Error = (uri: string) => {
    try {
        return new ApolloClient({
            link: link.concat(createHttpLink({ uri: uri })),
            cache: new InMemoryCache(),
        });
    } catch (err) {
        console.error('Failed to connect to client');
        return Error(err);
    }
};

export default {
    ApolloWrapper,
    useGlobalLoadingState,
};
