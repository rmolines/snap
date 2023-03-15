import {
	View,
	Text,
	Alert,
	SafeAreaView,
	Pressable,
	Modal,
	ActionSheetIOS,
} from "react-native";
import React, { useEffect, useState } from "react";
import { Link, useRouter, useSearchParams } from "expo-router";
import { supabase } from "../lib/supabase";
import { Image } from "expo-image";
import { AntDesign } from "@expo/vector-icons";
import { FileObject } from "@supabase/storage-js";

export default function Stories() {
	const { albumId } = useSearchParams();
	const [pictures, setPictures] = useState();
	const [picturesUrl, setPicturesUrl] = useState<string[]>([]);
	const [index, setIndex] = useState(0);
	const router = useRouter();

	async function getPictures(id: string) {
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
		} catch (error) {
			Alert.alert(error.message);
		} finally {
			//   setLoading(false)
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

			console.log(data);

			if (data) {
				Alert.alert("Successfully deleted photo!");
				await getPictures(albumId);

				if (index === pictures.length - 1) {
					router.push("/");
				}
				setIndex((prev) => prev + 1);
			}
		} catch (error) {
			Alert.alert(error.message);
		}
	}

	async function downloadPictures(file: FileObject) {
		try {
			const { data, error } = await supabase.storage
				.from("photos")
				.getPublicUrl(`${albumId}/${file.name}`);

			if (error) {
				throw error;
			}

			setPicturesUrl((prev) => [...prev, data.publicUrl]);
		} catch (error) {
			if (error instanceof Error) {
				console.log("Error downloading image: ", error.message);
			}
		}
	}

	useEffect(() => {
		if (albumId) {
			getPictures(albumId.toString());
		}
	}, []);

	// useEffect(() => {
	// 	if (pictures) {
	// 		downloadPicture(pictures[index].name);
	// 	}
	// }, [pictures, index]);

	return (
		<SafeAreaView className="flex-1 bg-black">
			<View className="flex-1 pb-8">
				{picturesUrl && (
					<View className="relative flex-1 overflow-hidden rounded-xl">
						<Image
							className="flex-1 justify-end p-4"
							source={picturesUrl[index]}
						>
							<View className="w-full flex-row gap-x-1">
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
						</Image>
						<Link
							href={"/"}
							className="absolute top-4 left-4 z-10 w-fit"
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
