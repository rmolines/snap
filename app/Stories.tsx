import {
	View,
	Text,
	Alert,
	SafeAreaView,
	Pressable,
	Modal,
	ActionSheetIOS,
	ActivityIndicator,
} from "react-native";
import React, { useEffect, useState } from "react";
import { Link, useRouter, useSearchParams } from "expo-router";
import { supabase } from "../lib/supabase";
import { Image } from "expo-image";
import { AntDesign } from "@expo/vector-icons";
import { FileObject } from "@supabase/storage-js";
import { useAuth0 } from "react-native-auth0";

export default function Stories() {
	const { albumId } = useSearchParams();
	const [pictures, setPictures] = useState();
	const [picturesUrl, setPicturesUrl] = useState<string[]>([]);
	const [index, setIndex] = useState(0);
	const router = useRouter();
	const [loading, setLoading] = useState(true);
	const { user } = useAuth0();

	async function getPictures2(id: string) {
		try {
			const { data, error } = await supabase.storage
				.from("photos")
				.list(`${id}`, {
					sortBy: { column: "created_at", order: "desc" },
				});

			if (error) {
				throw error;
			}

			setPictures(data);

			for (const file of data) {
				await downloadPictures(file);
			}

			return;
		} catch (error) {
			Alert.alert(error.message);
		}
	}

	async function getPictures(id: string) {
		try {
			const { data, error } = await supabase
				.from("album_photos")
				.select()
				.eq("album_id", id);

			if (error) {
				throw error;
			}

			console.log(data);
			setPictures(data);

			for (const file of data) {
				await downloadPictures(file);
			}

			return;
		} catch (error) {
			console.error(error);
			Alert.alert(error.message);
		}
	}

	async function deletePicture(file: string) {
		try {
			console.log(`${albumId}/${file}`);
			const { data, error } = await supabase.storage
				.from("photos")
				.remove([`${albumId}/${file}`]);

			if (error) {
				throw error;
			}

			if (data) {
				Alert.alert("Successfully deleted photo!");

				router.push("/");
				// await getPictures(albumId);

				// if (pictures.length === 0) {
				// 	router.push("/");
				// } else if (index > 0) {
				// 	setIndex((prev) => prev - 1);
				// }
			}
		} catch (error) {
			Alert.alert(error.message);
		}
	}

	async function downloadPictures(file: FileObject) {
		try {
			const { data, error } = await supabase.storage
				.from("photos")
				.getPublicUrl(`${albumId}/${file.photo_name}`);

			if (error) {
				throw error;
			}

			setPicturesUrl((prev) => [...prev, data.publicUrl]);

			return;
		} catch (error) {
			if (error instanceof Error) {
				console.log("Error downloading image: ", error.message);
			}
		}
	}

	async function seePicture(path: string) {
		try {
			const { data, error } = await supabase
				.from("seen_photos")
				.upsert({ sub: user.sub, photo_name: path, album_id: albumId });

			if (error) {
				throw error;
			}
		} catch (error) {
			Alert.alert(error.message);
		}
	}
	useEffect(() => {
		if (albumId) {
			getPictures(albumId.toString());
		}
	}, []);

	return (
		<SafeAreaView className="flex-1 bg-black">
			<View className="flex-1 pb-8">
				{picturesUrl && (
					<View className="relative flex-1 overflow-hidden rounded-xl">
						<Image
							className="relative flex-1 justify-end p-4"
							source={picturesUrl[index]}
							onLoadEnd={() => {
								setLoading(false);
								seePicture(pictures[index].photo_name);
								console.log(pictures[index].user_name);
							}}
						>
							<Text
								className="mb-2 text-base font-semibold text-white shadow-lg"
								style={[
									{
										shadowColor: "#000",
										shadowOffset: {
											width: 0,
											height: 2,
										},
										shadowOpacity: 0.25,
										shadowRadius: 3.84,

										elevation: 5,
									},
								]}
							>
								{pictures && pictures[index].user_name}
							</Text>
							<View
								className="w-full flex-row gap-x-1"
								style={[
									{
										shadowColor: "#000",
										shadowOffset: {
											width: 0,
											height: 2,
										},
										shadowOpacity: 0.25,
										shadowRadius: 3.84,

										elevation: 5,
									},
								]}
							>
								{pictures &&
									pictures.map((e, ind) => {
										if (index >= ind) {
											return (
												<View
													className="h-1 flex-1 rounded-full bg-white/90"
													key={ind}
												/>
											);
										} else {
											return (
												<View
													className="h-1 flex-1 rounded-full bg-white/10"
													key={ind}
												/>
											);
										}
									})}
							</View>
							{loading && (
								<View className="absolute top-0 left-0 z-50 h-screen w-screen flex-1 items-center justify-center bg-black/50">
									<ActivityIndicator
										size={"large"}
										color="white"
									/>
								</View>
							)}
						</Image>
						<Link
							href={"/"}
							className="absolute top-4 left-4 z-10 w-fit"
							style={[
								{
									shadowColor: "#000",
									shadowOffset: {
										width: 0,
										height: 2,
									},
									shadowOpacity: 0.25,
									shadowRadius: 3.84,

									elevation: 5,
								},
							]}
						>
							<AntDesign name="close" size={44} color="white" />
						</Link>
						<Pressable
							onPress={() =>
								ActionSheetIOS.showActionSheetWithOptions(
									{
										options: ["Cancel", "Report", "Delete"],
										destructiveButtonIndex: 2,
										cancelButtonIndex: 0,
										userInterfaceStyle: "light",
									},
									(buttonIndex) => {
										if (buttonIndex === 0) {
											// cancel action
										} else if (buttonIndex === 1) {
											Alert.alert("Report successful!");
										} else if (buttonIndex === 2) {
											deletePicture(pictures[index].name);
										}
									}
								)
							}
							className="absolute top-4 right-4 z-10 w-fit"
							style={[
								{
									shadowColor: "#000",
									shadowOffset: {
										width: 0,
										height: 2,
									},
									shadowOpacity: 0.25,
									shadowRadius: 3.84,

									elevation: 5,
								},
							]}
						>
							<AntDesign
								name="ellipsis1"
								size={44}
								color="white"
							/>
						</Pressable>
						<Pressable
							onPress={() => {
								if (index === pictures.length - 1) {
									router.push("/");
								}
								setIndex((prev) => prev + 1);
							}}
							className="absolute right-0 h-full w-2/5"
						/>
						<Pressable
							onPress={() => {
								setIndex((prev) => prev > 0 && prev - 1);
							}}
							className="absolute h-full w-2/5"
						/>
					</View>
				)}
			</View>
		</SafeAreaView>
	);
}
