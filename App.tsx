import { NavigationContainer, DarkTheme } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import { ActivityIndicator, StatusBar, View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { StoreProvider, useStore } from "./src/store";
import { colors } from "./src/theme";
import { LoginScreen } from "./src/screens/LoginScreen";
import { TodayScreen } from "./src/screens/TodayScreen";
import { TasksScreen } from "./src/screens/TasksScreen";
import { TaskDetailScreen } from "./src/screens/TaskDetailScreen";
import { GanttScreen } from "./src/screens/GanttScreen";
import { ContentScreen, ContentDetailScreen } from "./src/screens/ContentScreen";
import { MoreScreen } from "./src/screens/MoreScreen";
import type { RoadmapTask } from "./src/types";

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

type ParentNav = {
  getParent: () =>
    | { navigate: (name: string, params: Record<string, string>) => void }
    | undefined;
};

function TodayTab({ navigation }: { navigation: ParentNav }) {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={["top"]}>
      <TodayScreen
        onOpenTask={(task: RoadmapTask) =>
          navigation.getParent()?.navigate("TaskDetail", { taskId: task.id })
        }
      />
    </SafeAreaView>
  );
}

function TasksTab({ navigation }: { navigation: ParentNav }) {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={["top"]}>
      <TasksScreen
        onOpenTask={(task: RoadmapTask) =>
          navigation.getParent()?.navigate("TaskDetail", { taskId: task.id })
        }
      />
    </SafeAreaView>
  );
}

function GanttTab({ navigation }: { navigation: ParentNav }) {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={["top"]}>
      <GanttScreen
        onOpenTask={(task: RoadmapTask) =>
          navigation.getParent()?.navigate("TaskDetail", { taskId: task.id })
        }
      />
    </SafeAreaView>
  );
}

function ContentTab({ navigation }: { navigation: ParentNav }) {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={["top"]}>
      <ContentScreen
        onOpen={(id) => navigation.getParent()?.navigate("ContentDetail", { draftId: id })}
      />
    </SafeAreaView>
  );
}

function MoreTab({ navigation }: { navigation: ParentNav }) {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={["top"]}>
      <MoreScreen
        onCreated={(id) => navigation.getParent()?.navigate("TaskDetail", { taskId: id })}
      />
    </SafeAreaView>
  );
}

function Tabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.raised,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          paddingTop: 6,
        },
        tabBarLabelStyle: { fontSize: 10, fontWeight: "700" },
        tabBarActiveTintColor: colors.cyan,
        tabBarInactiveTintColor: colors.dim,
        tabBarIcon: ({ color, focused }) => {
          const map: Record<string, ComponentProps<typeof Ionicons>["name"]> = {
            Today: focused ? "sunny" : "sunny-outline",
            Tasks: focused ? "checkbox" : "checkbox-outline",
            Gantt: focused ? "git-branch" : "git-branch-outline",
            Content: focused ? "create" : "create-outline",
            More: focused ? "ellipsis-horizontal" : "ellipsis-horizontal-outline",
          };
          return <Ionicons name={map[route.name] ?? "ellipse-outline"} size={22} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Today" component={TodayTab} />
      <Tab.Screen name="Tasks" component={TasksTab} />
      <Tab.Screen name="Gantt" component={GanttTab} />
      <Tab.Screen name="Content" component={ContentTab} />
      <Tab.Screen name="More" component={MoreTab} />
    </Tab.Navigator>
  );
}

function Root() {
  const { ready, authed } = useStore();
  if (!ready) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color={colors.cyan} />
      </View>
    );
  }
  if (!authed) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
        <LoginScreen />
      </SafeAreaView>
    );
  }
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
      <Stack.Screen name="Tabs" component={Tabs} />
      <Stack.Screen
        name="TaskDetail"
        children={({ route, navigation }) => (
          <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={["top"]}>
            <TaskDetailScreen
              taskId={(route.params as { taskId: string }).taskId}
              onBack={() => navigation.goBack()}
            />
          </SafeAreaView>
        )}
      />
      <Stack.Screen
        name="ContentDetail"
        children={({ route, navigation }) => (
          <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={["top"]}>
            <ContentDetailScreen
              draftId={(route.params as { draftId: string }).draftId}
              onBack={() => navigation.goBack()}
            />
          </SafeAreaView>
        )}
      />
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" />
      <StoreProvider>
        <NavigationContainer
          theme={{
            ...DarkTheme,
            colors: {
              ...DarkTheme.colors,
              background: colors.bg,
              card: colors.raised,
              text: colors.ink,
              border: colors.border,
              primary: colors.cyan,
            },
          }}
        >
          <Root />
        </NavigationContainer>
      </StoreProvider>
    </SafeAreaProvider>
  );
}
