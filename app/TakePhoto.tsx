import {
	Camera,
	CameraCapturedPicture,
	CameraType,
	ImageType,
} from "expo-camera";
import { View, Text, Pressable } from "react-native";
import React, { useRef, useState } from "react";
import { Link, useRouter, useSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { AntDesign } from "@expo/vector-icons";
import { supabase } from "../lib/supabase";
import { Image } from "expo-image";
import { FlipType, manipulateAsync, SaveFormat } from "expo-image-manipulator";
import { ActivityIndicator } from "react-native";

export default function TakePhoto() {
	const [type, setType] = useState(CameraType.back);
	const [permission, requestPermission] = Camera.useCameraPermissions();
	const [camera, setCamera] = useState<Camera>();
	const [uploadingPicture, setUploadingPicture] = useState(false);
	const [takingPicture, setTakingPicture] = useState(false);
	const [picture, setPicture] = useState<CameraCapturedPicture>();
	const router = useRouter();
	const { id } = useSearchParams();

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

	async function takePicture(params: type) {
		try {
			setTakingPicture(true);
			const imageType = ImageType.jpg;
			let picture = await camera.takePictureAsync({
				imageType,
				isImageMirror: false,
			});

			if (type === CameraType.front) {
				picture = await manipulateAsync(
					picture.uri,
					[{ rotate: 180 }, { flip: FlipType.Vertical }],
					{ compress: 1, format: SaveFormat.JPEG }
				);
			}

			setPicture(picture);
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

			const filePath = `${id}/${Math.random()}.${imageType}`;
			const { error: errorStorage } = await supabase.storage
				.from("photos")
				.upload(filePath, formData);

			if (errorStorage) {
				throw errorStorage;
			}
		} catch (error) {
			console.error(error);
		} finally {
			setUploadingPicture(false);
			router.push("/");
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
							className="flex-1"
							// ref={cameraRef}
							ref={(ref) => setCamera(ref)}
						>
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
								<Link href="/" className="m-10 self-end">
									{/* <Text className="text-center text-2xl font-semibold text-white">
							Back
						</Text> */}
									<AntDesign
										name="close"
										size={40}
										color="white"
									/>
								</Link>
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
