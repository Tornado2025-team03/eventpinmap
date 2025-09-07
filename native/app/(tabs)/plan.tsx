// app/(tabs)/EventCreateScreen.tsx (refactored)
import React from "react";
import {
  SafeAreaView,
  ScrollView,
  Text,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useEventForm } from "../../hooks/useEventForm";
import { Step1 } from "../../components/events/Step1";
import { Step2 } from "../../components/events/Step2";
import { Step3 } from "../../components/events/Step3";

export default function EventCreateScreen() {
  const f = useEventForm();

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 72 : 0}
      >
        <ScrollView
          contentContainerStyle={{ padding: 16 }}
          keyboardShouldPersistTaps="handled"
          automaticallyAdjustKeyboardInsets
        >
          <Text
            style={{
              fontSize: 24,
              fontWeight: "bold",
              textAlign: "center",
              marginBottom: 4,
            }}
          >
            募集する
          </Text>
          <Text
            style={{ textAlign: "center", color: "#666", marginBottom: 16 }}
          >
            必要事項を入力
          </Text>

          {f.step === 1 && (
            <Step1
              title={f.title}
              setTitle={f.setTitle}
              suggestedTitle={f.suggestedTitle}
              what={f.what}
              setWhat={f.setWhat}
              when={f.when}
              endAt={f.endAt}
              formattedStart={f.formattedStart}
              formattedEnd={f.formattedEnd}
              where={f.where}
              setWhere={f.setWhere}
              latitude={f.latitude}
              longitude={f.longitude}
              setLatitude={f.setLatitude}
              setLongitude={f.setLongitude}
              geocodeCurrentAddress={f.geocodeCurrentAddress}
              setCoordinatesAndReverseGeocode={
                f.setCoordinatesAndReverseGeocode
              }
              showPicker={f.showPicker}
              pickerMode={f.pickerMode}
              targetField={f.targetField}
              openPicker={f.openPicker}
              onChangePicker={f.onChangePicker}
              setQuickDate={f.setQuickDate}
              next={f.next}
              canNext1={f.canNext1}
            />
          )}

          {f.step === 2 && (
            <Step2
              tags={f.tags}
              toggleTag={f.toggleTag}
              capacity={f.capacity}
              setCapacity={f.setCapacity}
              fee={f.fee}
              setFee={f.setFee}
              description={f.description}
              setDescription={f.setDescription}
              addDetailsOpen={f.addDetailsOpen}
              setAddDetailsOpen={f.setAddDetailsOpen}
              back={f.back}
              next={f.next}
              iconName={f.iconName}
              setIconName={f.setIconName}
              chooseIconManually={f.chooseIconManually}
              resetIconAuto={f.resetIconAuto}
            />
          )}

          {f.step === 3 && (
            <Step3
              what={f.what}
              formattedStart={f.formattedStart}
              formattedEnd={f.formattedEnd}
              where={f.where}
              latitude={f.latitude}
              longitude={f.longitude}
              title={f.title}
              suggestedTitle={f.suggestedTitle}
              tags={f.tags}
              capacity={f.capacity}
              fee={f.fee}
              description={f.description}
              rule={f.rule}
              publishing={f.publishing}
              back={f.back}
              handlePublish={f.handlePublish}
              iconName={f.iconName}
            />
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
