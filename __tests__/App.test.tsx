/**
 * @format
 */

import type { ReactNode } from 'react';
import ReactTestRenderer from 'react-test-renderer';

jest.mock('heroui-native', () => {
  const ReactLocal = require('react');
  const {
    ActivityIndicator,
    Text,
    TextInput,
    TouchableOpacity,
    View,
  } = require('react-native');

  const ViewWrapper = ({ children }: { children?: ReactNode }) => (
    <View>{children}</View>
  );

  const TextWrapper = ({ children }: { children?: ReactNode }) => (
    <Text>{children}</Text>
  );

  const Button = ({
    children,
    onPress,
  }: {
    children?: ReactNode;
    onPress?: () => void;
  }) => <TouchableOpacity onPress={onPress}>{children}</TouchableOpacity>;

  Button.Label = TextWrapper;

  const Card = ViewWrapper;
  Card.Header = ViewWrapper;
  Card.Title = TextWrapper;
  Card.Description = TextWrapper;
  Card.Body = ViewWrapper;
  Card.Footer = ViewWrapper;

  const Input = (props: object) => <TextInput {...props} />;
  const Spinner = (props: object) => <ActivityIndicator {...props} />;

  return {
    Button,
    Card,
    FieldError: TextWrapper,
    HeroUINativeProvider: ViewWrapper,
    Input,
    Label: TextWrapper,
    Spinner,
    TextField: ViewWrapper,
    __esModule: true,
    default: ReactLocal,
  };
});

jest.mock('@react-navigation/native', () => ({
  NavigationContainer: ({ children }: { children?: ReactNode }) => children,
}));

jest.mock('@react-navigation/bottom-tabs', () => {
  const { View } = require('react-native');

  const Navigator = ({ children }: { children?: ReactNode }) => (
    <View>{children}</View>
  );

  const Screen = ({
    children,
    component: Component,
  }: {
    children?: ReactNode | (() => ReactNode);
    component?: () => JSX.Element;
  }) => {
    if (typeof children === 'function') {
      return <>{children()}</>;
    }

    if (Component) {
      return <Component />;
    }

    return <View>{children}</View>;
  };

  return {
    createBottomTabNavigator: () => ({
      Navigator,
      Screen,
    }),
  };
});

jest.mock('@react-native-vector-icons/fontawesome6', () => ({
  FontAwesome6: () => null,
}));

jest.mock('react-native-appwrite', () => {
  class AppwriteException extends Error {
    code: number;

    constructor(message = 'Mock Appwrite error', code = 500) {
      super(message);
      this.code = code;
    }
  }

  class Client {
    setEndpoint() {
      return this;
    }

    setEndpointRealtime() {
      return this;
    }

    setProject() {
      return this;
    }

    setPlatform() {
      return this;
    }

    subscribe() {
      return () => {};
    }
  }

  class Account {}
  class Databases {}

  return {
    Account,
    AppwriteException,
    Client,
    Databases,
    ID: { unique: () => 'mock-id' },
    Query: {
      limit: (value: number) => `limit(${value})`,
      offset: (value: number) => `offset(${value})`,
      orderDesc: (value: string) => `orderDesc(${value})`,
    },
  };
});

jest.mock('../src/hooks/useAuth', () => ({
  useCurrentUserQuery: () => ({
    data: null,
    isError: false,
    isPending: false,
    isSuccess: true,
  }),
  useSignInMutation: () => ({
    mutateAsync: jest.fn(),
    error: null,
    isPending: false,
  }),
  useSignOutMutation: () => ({
    mutateAsync: jest.fn(),
    error: null,
    isPending: false,
  }),
  useUpdateProfileMutation: () => ({
    mutateAsync: jest.fn(),
    error: null,
    isPending: false,
  }),
  useSignUpMutation: () => ({
    mutateAsync: jest.fn(),
    error: null,
    isPending: false,
  }),
}));

jest.mock('../src/store/authStore', () => ({
  useAuthStore: <T,>(
    selector: (state: {
      user: null;
      isAuthenticated: boolean;
      isBootstrapping: boolean;
      setUser: jest.Mock;
      setBootstrapping: jest.Mock;
      resetAuth: jest.Mock;
    }) => T,
  ) =>
    selector({
      user: null,
      isAuthenticated: false,
      isBootstrapping: false,
      setUser: jest.fn(),
      setBootstrapping: jest.fn(),
      resetAuth: jest.fn(),
    }),
}));

const App = require('../src/App').default;

test('renders correctly', async () => {
  await ReactTestRenderer.act(() => {
    ReactTestRenderer.create(<App />);
  });
});
