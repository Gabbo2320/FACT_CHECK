import { Drawer } from 'expo-router/drawer';
import CustomDrawer from '../../components/CustomDrawer'; // Assicurati di avere questo file!

export default function HomeLayout() {
  return (
    <Drawer
      drawerContent={(props) => <CustomDrawer {...props} />}
      screenOptions={{
        // 🚨 QUESTO SPEGNE LO SCORRIMENTO COL DITO 🚨
        swipeEnabled: false,
        // 🍔 QUESTO ACCENDE L'ICONA CON LE 3 LINEE CLICCABILI 🍔
        headerShown: true,
        headerTintColor: '#000',
        headerStyle: { backgroundColor: '#fff' },
      }}
    >
      <Drawer.Screen
        name="index"
        options={{
          drawerLabel: 'Home',
          title: 'FactCheck AI',
        }}
      />
    </Drawer>
  );
}