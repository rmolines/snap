import { Pressable, SafeAreaView, Text, View } from "react-native";
import React from "react";
import { useForm } from "react-hook-form";
import { useAuth0 } from "react-native-auth0";

const LoginButton = () => {
	const { authorize } = useAuth0();

	const onPress = async () => {
		try {
			await authorize();
		} catch (e) {
			console.log(e);
		}
	};

	return (
		<SafeAreaView className="w-full">
			<View className="w-full px-8">
				<Pressable
					onPress={onPress}
					className="flex h-12 w-full items-center justify-center rounded-lg border bg-black"
				>
					<Text className="text-lg font-semibold text-white">
						Log In
					</Text>
				</Pressable>
			</View>
		</SafeAreaView>
	);
};

const Login = () => {
	const {
		control,
		handleSubmit,
		formState: { errors },
	} = useForm({
		defaultValues: {
			firstName: "",
			lastName: "",
		},
	});
	const onSubmit = (data) => console.log(data);

	return (
		<SafeAreaView className="flex h-screen items-center justify-center gap-y-1 px-12">
			<LoginButton />
		</SafeAreaView>
	);
};

export default Login;
