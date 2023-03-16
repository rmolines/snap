import {
	View,
	Text,
	SafeAreaView,
	Alert,
	Pressable,
	FlatList,
	Share,
	ActionSheetIOS,
	Platform,
	RefreshControl,
} from "react-native";
import React, { useEffect, useRef, useState } from "react";
import Login from "./Login";
import { useAuth0 } from "react-native-auth0";
import { supabase } from "../lib/supabase";
import { AntDesign } from "@expo/vector-icons";
import { Link, useRouter, useSearchParams } from "expo-router";
import * as Linking from "expo-linking";
import * as Sharing from "expo-sharing";
import "react-native-gesture-handler";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";

Notifications.setNotificationHandler({
	handleNotification: async () => ({
		shouldShowAlert: true,
		shouldPlaySound: false,
		shouldSetBadge: false,
	}),
});

async function sendPushNotification(expoPushToken) {
	const message = {
		to: expoPushToken,
		sound: "default",
		title: "Original Title",
		body: "And here is the body!",
		data: { someData: "goes here" },
	};

	await fetch("https://exp.host/--/api/v2/push/send", {
		method: "POST",
		headers: {
			Accept: "application/json",
			"Accept-encoding": "gzip, deflate",
			"Content-Type": "application/json",
		},
		body: JSON.stringify(message),
	});
}

async function registerForPushNotificationsAsync() {
	let token;
	if (Device.isDevice) {
		const { status: existingStatus } =
			await Notifications.getPermissionsAsync();
		let finalStatus = existingStatus;
		if (existingStatus !== "granted") {
			const { status } = await Notifications.requestPermissionsAsync();
			finalStatus = status;
		}
		if (finalStatus !== "granted") {
			alert("Failed to get push token for push notification!");
			return;
		}
		token = (await Notifications.getExpoPushTokenAsync()).data;
	} else {
		alert("Must use physical device for Push Notifications");
	}

	if (Platform.OS === "android") {
		Notifications.setNotificationChannelAsync("default", {
			name: "default",
			importance: Notifications.AndroidImportance.MAX,
			vibrationPattern: [0, 250, 250, 250],
			lightColor: "#FF231F7C",
		});
	}

	return token;
}

export default function Index() {
	const { user, clearSession } = useAuth0();
	const [albums, setAlbums] = useState();
	const [albumPhotos, setAlbumPhotos] = useState();
	const router = useRouter();
	const id = useSearchParams();
	const url = Linking.useURL();
	const [expoPushToken, setExpoPushToken] = useState("");
	const [notification, setNotification] = useState(false);
	const notificationListener = useRef();
	const responseListener = useRef();
	const [refreshing, setRefreshing] = React.useState(false);

	const onRefresh = React.useCallback(() => {
		setRefreshing(true);
		// setTimeout(() => {
		// 	setRefreshing(false);
		// }, 2000);
		getAlbums().then(() => setRefreshing(false));
	}, []);

	async function getAlbum(id: string) {
		try {
			//   setLoading(true)
			// if (!session?.user) throw new Error("No user on the session!");

			const { data, error, status } = await supabase
				.from("albums")
				// .select("album(name), album(id), sub")
				.select()
				.eq("id", id)
				.single();

			if (error && status !== 406) {
				throw error;
			}
			if (data) {
				Alert.alert(`Deseja entrar no grupo ${data.name}?`, "", [
					{
						text: "Cancel",
						style: "cancel",
					},
					{ text: "OK", onPress: () => joinAlbum(id) },
				]);
			}
		} catch (error) {
			Alert.alert(error);
		}
	}

	async function getAlbums() {
		try {
			//   setLoading(true)
			// if (!session?.user) throw new Error("No user on the session!");

			const { data, error, status } = await supabase
				.from("album_members")
				// .select("album(name), album(id), sub")
				.select("album(name, id)")
				.eq("sub", user.sub);

			if (error && status !== 406) {
				throw error;
			}

			if (data) {
				setAlbums(data.map((d) => d.album));
			}

			// data.forEach((d) => getPhotos(d.album.id));

			await Promise.all(data.map((d) => getPhotos(d.album.id)));
		} catch (error) {
			if (error instanceof Error) {
				Alert.alert(error.message);
			}
		} finally {
			//   setLoading(false)
		}
	}

	async function createAlbum(name: string) {
		try {
			//   setLoading(true)
			// if (!session?.user) throw new Error("No user on the session!");

			const { data, error, status } = await supabase
				.from("albums")
				.insert({ name: name })
				.select();

			if (error && status !== 406) {
				throw error;
			}

			if (data) {
				await joinAlbum(data[0].id);
			}
			await getAlbums();
		} catch (error) {
			Alert.alert(error.message);
		} finally {
			//   setLoading(false)
		}
	}

	async function joinAlbum(id: string) {
		try {
			const { data, error, status } = await supabase
				.from("album_members")
				.insert({
					sub: user.sub,
					album: id,
					expo_token: expoPushToken,
				});

			if (error && status !== 406) {
				throw error;
			}

			getAlbums();
		} catch (error) {
			Alert.alert(error.message);
		} finally {
			//   setLoading(false)
		}
	}

	async function leaveAlbum(id: string) {
		try {
			const { data, error, status } = await supabase
				.from("album_members")
				.delete()
				.eq("sub", user.sub)
				.eq("album", id);

			if (error && status !== 406) {
				throw error;
			}

			getAlbums();
		} catch (error) {
			console.log(error);
			Alert.alert(error.message);
		} finally {
			//   setLoading(false)
		}
	}

	async function getPhotos(id: number) {
		try {
			const { count, error } = await supabase
				.from("album_photos")
				.select("*", { count: "exact", head: true })
				.eq("album_id", id);

			if (error) {
				throw error;
			}

			const { count: count2, error: error2 } = await supabase
				.from("seen_photos")
				.select("*", { count: "exact", head: true })
				.eq("sub", user.sub)
				.eq("album_id", id);

			console.log({
				photo_count: count,
				unseen_photos: count - count2,
				seen_photos: count2,
			});

			setAlbumPhotos((prev) => ({
				...prev,
				[id]: {
					photo_count: count,
					unseen_photos: count - count2,
					seen_photos: count2,
				},
			}));
		} catch (error) {
			if (error instanceof Error) {
				Alert.alert(error.message);
			}
		} finally {
			//   setLoading(false)
		}
	}

	const logOut = async () => {
		try {
			await clearSession();
		} catch (e) {
			console.log(e);
		}
	};

	useEffect(() => {
		if (user && user.sub) {
			getAlbums().then();
		}
	}, [user]);

	useEffect(() => {
		if (url && Linking.parse(url).queryParams) {
			getAlbum(Linking.parse(url).queryParams.id);
		}
	}, [url]);

	useEffect(() => {
		registerForPushNotificationsAsync().then((token) =>
			setExpoPushToken(token)
		);

		notificationListener.current =
			Notifications.addNotificationReceivedListener((notification) => {
				console.log(notification);
				setNotification(notification);
			});

		responseListener.current =
			Notifications.addNotificationResponseReceivedListener(
				(response) => {
					console.log(response);
				}
			);

		return () => {
			Notifications.removeNotificationSubscription(
				notificationListener.current
			);
			Notifications.removeNotificationSubscription(
				responseListener.current
			);
		};
	}, []);

	return (
		<>
			{user ? (
				<SafeAreaView>
					<View className="flex h-screen flex-col pt-2">
						<View className="relative flex w-full flex-row items-center justify-center border-b border-gray-200 px-8 pb-3">
							<Pressable
								className="absolute inset-y-0 left-6"
								onPress={() => {
									ActionSheetIOS.showActionSheetWithOptions(
										{
											options: [
												"Cancel",
												"Logout",
												"Delete account",
											],
											destructiveButtonIndex: 2,
											cancelButtonIndex: 0,
											userInterfaceStyle: "light",
										},
										(buttonIndex) => {
											if (buttonIndex === 0) {
												// cancel action
											} else if (buttonIndex === 1) {
												logOut();
											} else if (buttonIndex === 2) {
												Alert.alert(
													`Deseja deletar sua conta?`,
													"Isto pode demorar até 14 dias",
													[
														{
															text: "Cancel",
															style: "cancel",
														},
														{
															text: "Deletar",
															style: "destructive",
															onPress: () => {
																logOut();
															},
														},
													]
												);
											}
										}
									);
								}}
							>
								<AntDesign
									name="user"
									size={30}
									color="black"
									className="absolute"
								/>
							</Pressable>
							<Text className="text-2xl font-semibold">
								Groups
							</Text>
							<Pressable
								className="absolute inset-y-0 right-6"
								onPress={() =>
									Alert.prompt(
										"Criar grupo",
										"Nome do grupo",
										(name) => {
											createAlbum(name);
										}
									)
								}
							>
								<AntDesign
									name="plus"
									size={30}
									color="black"
									className="absolute"
								/>
							</Pressable>
						</View>
						<View>
							<FlatList
								className="h-full"
								data={albums}
								keyExtractor={(item) => item.id}
								refreshControl={
									<RefreshControl
										refreshing={refreshing}
										onRefresh={onRefresh}
									/>
								}
								renderItem={({ item }) => {
									return (
										<Pressable
											key={item.id}
											className="flex h-16 flex-row items-center justify-between border-b border-gray-200 pl-6 pr-4"
											onPress={() => {
												if (
													albumPhotos[item.id] &&
													albumPhotos[item.id]
														.photo_count > 0
												) {
													router.push({
														pathname: "/Stories",
														params: {
															albumId: item.id,
														},
													});
												}
											}}
										>
											<View className="flex flex-row items-center gap-x-1">
												<Text className="text-xl font-medium">
													{item.name}
												</Text>
												{albumPhotos &&
												albumPhotos[item.id] &&
												albumPhotos[item.id]
													.unseen_photos > 0 ? (
													<View className="h-4 w-4 justify-center rounded-full bg-blue-500">
														<Text className="text-center text-xs font-bold text-white">
															{
																albumPhotos[
																	item.id
																].unseen_photos
															}
														</Text>
													</View>
												) : (
													albumPhotos &&
													albumPhotos[item.id] &&
													albumPhotos[item.id]
														.seen_photos > 0 && (
														<View className="h-4 w-4 justify-center rounded-full bg-gray-500">
															<Text className="text-center text-xs font-bold text-white">
																{
																	albumPhotos[
																		item.id
																	]
																		.seen_photos
																}
															</Text>
														</View>
													)
												)}
											</View>
											<View className="h-full flex-row items-center gap-x-2">
												<Link
													href={{
														pathname: "/TakePhoto",
														params: {
															id: item.id,
															album_name:
																item.name,
														},
													}}
													className="p-2"
												>
													<AntDesign
														name="camerao"
														size={28}
														color="black"
													/>
												</Link>
												<Pressable
													className="p-2"
													onPress={() => {
														// Sharing.shareAsync(
														// 	"acme://id=2",
														// 	{
														// 		UTI: "public.text",
														// 	}
														// );
														ActionSheetIOS.showActionSheetWithOptions(
															{
																options: [
																	"Cancel",
																	"Share",
																	"Leave",
																],
																destructiveButtonIndex: 2,
																cancelButtonIndex: 0,
																userInterfaceStyle:
																	"light",
															},
															(buttonIndex) => {
																if (
																	buttonIndex ===
																	0
																) {
																	// cancel action
																} else if (
																	buttonIndex ===
																	1
																) {
																	Share.share(
																		{
																			message: `Entre no meu grupo: acme://?id=${item.id}`,
																		}
																	);
																} else if (
																	buttonIndex ===
																	2
																) {
																	Alert.alert(
																		`Deseja sair no grupo ${item.name}?`,
																		"",
																		[
																			{
																				text: "Cancel",
																				style: "cancel",
																			},
																			{
																				text: "Leave",
																				style: "destructive",
																				onPress:
																					() =>
																						leaveAlbum(
																							item.id
																						),
																			},
																		]
																	);
																}
															}
														);
													}}
												>
													{/* <AntDesign
											name="right"
											size={28}
											color="lightgray"
										/> */}
													{/* <AntDesign
											name="adduser"
											size={32}
											color="black"
										/> */}
													<AntDesign
														name="ellipsis1"
														size={28}
														color="black"
													/>
												</Pressable>
											</View>
										</Pressable>
									);
								}}
							/>
						</View>
					</View>
					<Text>{user.name}</Text>
				</SafeAreaView>
			) : (
				<Login />
			)}
		</>
	);
}
