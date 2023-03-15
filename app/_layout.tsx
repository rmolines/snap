import { Slot } from "expo-router";
import { Auth0Provider, useAuth0 } from "react-native-auth0";
import React from "react";
import Login from "./Login";
import { Text } from "react-native";

export default function MainLayout() {
	return (
		<Auth0Provider
			domain={"dev-e3qx41fv.us.auth0.com"}
			clientId={"V3mgwgBBAMMP7F2IQYOavvrb9Xfp4VnP"}
		>
			<Slot />
		</Auth0Provider>
	);
}
