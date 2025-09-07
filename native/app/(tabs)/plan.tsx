// app/(tabs)/plan.tsx
import React from "react";
import {
  SafeAreaView,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useEventForm } from "../../hooks/useEventForm";
import { Step1 } from "../../components/events/Step1Card";
import { Step2 } from "../../components/events/Step2";
import { Step3 } from "../../components/events/Step3";

export default function EventCreateScreen() {
  const f = useEventForm();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#F7F9FB" }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 72 : 0}
      >
        <ScrollView
          contentContainerStyle={{ padding: 16, paddingTop: 16 }}
          keyboardShouldPersistTaps="handled"
          automaticallyAdjustKeyboardInsets
        >
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
              setStartTimeQuick={f.setStartTimeQuick}
              setDurationQuick={f.setDurationQuick}
              next={f.next}
              canNext1={f.canNext1}
              aiFill={f.aiFill}
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
