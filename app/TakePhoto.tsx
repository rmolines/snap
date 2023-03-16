import {
	Camera,
	CameraCapturedPicture,
	CameraType,
	ImageType,
} from "expo-camera";
import { View, Text, Pressable, TouchableHighlight, Alert } from "react-native";
import React, { useEffect, useState } from "react";
import { Link, useRouter, useSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { AntDesign } from "@expo/vector-icons";
import { supabase } from "../lib/supabase";
import { Image } from "expo-image";
import { FlipType, manipulateAsync, SaveFormat } from "expo-image-manipulator";
import { ActivityIndicator } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useAuth0 } from "react-native-auth0";

async function sendPushNotification(
	expoPushToken: string,
	title: string,
	body: string
) {
	const message = {
		to: expoPushToken,
		sound: "default",
		title,
		body,
		// data: { someData: "goes here" },
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

export default function TakePhoto() {
	const [type, setType] = useState(CameraType.back);
	const [permission, requestPermission] = Camera.useCameraPermissions();
	const [camera, setCamera] = useState<Camera>();
	const [uploadingPicture, setUploadingPicture] = useState(false);
	const [takingPicture, setTakingPicture] = useState(false);
	const [picture, setPicture] = useState<CameraCapturedPicture>();
	const [tokens, setTokens] = useState();
	const router = useRouter();
	const { id, album_name } = useSearchParams();
	const { user } = useAuth0();

	useEffect(() => {
		getPushTokens();
	}, []);

	if (!permission) {
		// Camera permissions are still loading
		return <View />;
	}

	if (!permission.granted) {
		// Camera permissions are not granted yet
		return (
			<View className="flex flex-1 items-center justify-center">
				<Text className="text-center">
					We need your permission to show the camera
				</Text>
				<Pressable onPress={requestPermission} className="self-center">
					<Text>Grant Permission</Text>
				</Pressable>
			</View>
		);
	}

	function toggleCameraType() {
		setType((current) =>
			current === CameraType.back ? CameraType.front : CameraType.back
		);
	}

	async function takePicture() {
		try {
			setTakingPicture(true);
			const imageType = ImageType.jpg;
			let picture = await camera.takePictureAsync({
				imageType,
				isImageMirror: false,
				quality: 1,
			});

			if (type === CameraType.front) {
				picture = await manipulateAsync(
					picture.uri,
					[{ rotate: 180 }, { flip: FlipType.Vertical }],
					{ compress: 0, format: SaveFormat.JPEG }
				);
				setPicture(picture);
			} else {
				picture = await manipulateAsync(picture.uri, [], {
					compress: 0,
					format: SaveFormat.JPEG,
				});
				setPicture(picture);
			}
		} catch (error) {
			console.error(error);
		} finally {
			setTakingPicture(false);
		}
	}

	async function uploadPicture() {
		try {
			setUploadingPicture(true);
			const imageType = ImageType.jpg;

			const photo = {
				uri: picture.uri,
				type: imageType,
				name: `test.${imageType}`,
			};

			const formData = new FormData();
			formData.append("file", photo);

			const fileName = `${Math.random()}.${imageType}`;
			const { error: errorStorage } = await supabase.storage
				.from("photos")
				.upload(`${id}/${fileName}`, formData);

			if (errorStorage) {
				throw errorStorage;
			}

			const { data, error: error2 } = await supabase
				.from("album_photos")
				.insert({
					sub: user.sub,
					user_name: user.name,
					album_id: `${id}`,
					photo_name: fileName,
				});

			if (error2) {
				throw error2;
			}

			const title = `Togather`;
			const body = `${user.name} postou uma foto em ${album_name}`;
			tokens.forEach((token) =>
				sendPushNotification(token.expo_token, title, body)
			);
		} catch (error) {
			console.error(error);
			Alert.alert(error.message);
		} finally {
			setUploadingPicture(false);
			router.push("/");
		}
	}

	const pickImageAsync = async () => {
		const result = await ImagePicker.launchImageLibraryAsync({
			// allowsEditing: true,
			quality: 1,
		});

		const picture = await manipulateAsync(result.assets[0].uri, [], {
			compress: 0,
			format: SaveFormat.JPEG,
		});

		if (!result.canceled) {
			setPicture(picture);
			console.log(picture);
		} else {
			alert("You did not select any image.");
		}
	};

	async function getPushTokens() {
		try {
			const { data, error, status } = await supabase
				.from("album_members")
				// .select("album(name), album(id), sub")
				.select("expo_token")
				.eq("album", id);

			if (error && status !== 406) {
				throw error;
			}

			if (data) {
				setTokens(data);
				console.log(data);
			}
		} catch (error) {
			if (error instanceof Error) {
				Alert.alert(error.message);
			}
		}
	}

	return (
		<SafeAreaView className="flex-1 justify-center overflow-hidden rounded-lg bg-black">
			<View className="flex-1 justify-center">
				<View className="flex-1 overflow-hidden rounded-2xl">
					{picture ? (
						<Image source={{ ...picture }} className="flex-1">
							{uploadingPicture && (
								<View className="flex-1 items-center justify-center bg-black/50">
									{/* <AntDesign
										name="loading1"
										size={50}
										color="white"
									/> */}
									<ActivityIndicator
										size={"large"}
										color="white"
									/>
								</View>
							)}
						</Image>
					) : (
						<Camera
							type={type}
							className="relative flex-1"
							// ref={cameraRef}
							ref={(ref) => setCamera(ref)}
						>
							<Link
								href={"/"}
								className="absolute top-4 left-4 z-10 w-fit"
							>
								<AntDesign
									name="close"
									size={44}
									color="white"
								/>
							</Link>
							{takingPicture && (
								<View className="flex-1 items-center justify-center bg-black/50">
									{/* <AntDesign
									name="loading1"
									size={50}
									color="white"
								/> */}
									<ActivityIndicator
										size={"large"}
										color="white"
									/>
								</View>
							)}
						</Camera>
					)}
				</View>

				<View className="flex-row py-4">
					{picture ? (
						<>
							<View className="flex-1">
								<Pressable
									onPress={() => setPicture()}
									className="m-10 self-end"
								>
									{/* <Text className="text-center text-2xl font-semibold text-white">
							Back
						</Text> */}
									<AntDesign
										name="closecircleo"
										size={50}
										color="white"
									/>
								</Pressable>
							</View>
							<View className="flex-1">
								<Pressable
									onPress={uploadPicture}
									className="m-10 self-start"
								>
									{/* <Text className="text-center text-2xl font-semibold text-white">
							Back
						</Text> */}
									<AntDesign
										name="rightcircleo"
										size={50}
										color="white"
									/>
								</Pressable>
							</View>
						</>
					) : (
						<>
							<View className="flex-1">
								<TouchableHighlight
									onPress={pickImageAsync}
									className="m-10 self-end"
								>
									{/* <Text className="text-center text-2xl font-semibold text-white">
							Back
						</Text> */}
									<AntDesign
										name="picture"
										size={40}
										color="white"
									/>
								</TouchableHighlight>
							</View>
							<Pressable
								className="h-20 w-20 self-center rounded-full border-[6px] border-white"
								onPress={takePicture}
							/>
							<View className="flex-1">
								<Pressable
									onPress={toggleCameraType}
									className="m-10 self-start"
								>
									{/* <Text className="text-center text-2xl font-semibold text-white">
							Flip
						</Text> */}
									<AntDesign
										name="retweet"
										size={40}
										color="white"
									/>
								</Pressable>
							</View>
						</>
					)}
				</View>
			</View>
		</SafeAreaView>
	);
}
