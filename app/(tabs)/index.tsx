import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  Alert,
} from 'react-native';

// Import our refactored components and utilities
import { Entry } from '../../types/Entry';
import { useEntries } from '../../hooks/useEntries';
import { MOOD_LABELS } from '../../constants/moods';
import { WelcomeScreen } from '../../components/WelcomeScreen';
import { EntryItem } from '../../components/EntryItem';
import { EntryWriter } from '../../components/EntryWriter';
import { EntryModal } from '../../components/EntryModal';

export default function HomeScreen() {
  // Local state for UI flow
  const [showWelcome, setShowWelcome] = useState(true);
  const [isWriting, setIsWriting] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<Entry | null>(null);
  const [showEntryModal, setShowEntryModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  // Use our custom hook for data management
  const {
    entries,
    loading,
    error,
    createEntry,
    updateEntry,
    deleteEntry,
  } = useEntries();

  // Event handlers
  const handleStart = () => setShowWelcome(false);

  const handleWriteEntry = () => setIsWriting(true);

  const handleEntrySelect = (entry: Entry) => {
    setSelectedEntry(entry);
    setShowEntryModal(true);
    setIsEditMode(false);
  };

  const handleEntryEdit = () => {
    setIsEditMode(true);
  };

  const handleEntryDelete = () => {
    if (!selectedEntry) return;

    Alert.alert(
      'Delete Entry',
      'Are you sure you want to delete this entry?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => performDelete(),
        },
      ]
    );
  };

  const performDelete = async () => {
    if (!selectedEntry) {
      console.log('performDelete called but no selectedEntry');
      return;
    }

    console.log('Attempting to delete entry:', selectedEntry.id);
    const success = await deleteEntry(selectedEntry.id);
    console.log('Delete operation returned:', success);

    if (success) {
      console.log('Delete successful. Closing modal.');
      setShowEntryModal(false);
      setSelectedEntry(null);
    } else {
      console.error('Delete failed. The entry might not have been deleted.');
      Alert.alert(
        'Delete Failed',
        error || 'An unknown error occurred while trying to delete the entry.'
      );
    }
  };

  const handleSaveEntry = async (formData: {
    text: string;
    description: string;
    selectedMood: string;
    mediaUrls: string[];
  }) => {
    const finalDescription = formData.description.trim() ||
      MOOD_LABELS[formData.selectedMood as keyof typeof MOOD_LABELS] ||
      formData.selectedMood ||
      "Today's Journal";

    const success = await createEntry(
      finalDescription,
      formData.text,
      formData.selectedMood,
      formData.mediaUrls
    );

    if (success) {
      return true;
    }
    return false;
  };

  const handleSaveEdit = async (title: string, content: string, mood: string) => {
    if (!selectedEntry) return false;

    const success = await updateEntry(selectedEntry.id, title, content, mood);
    if (success) {
      setShowEntryModal(false);
      setSelectedEntry(null);
      setIsEditMode(false);
    }
    return success;
  };

  const handleCloseModal = () => {
    setShowEntryModal(false);
    setSelectedEntry(null);
    setIsEditMode(false);
  };

  return (
    <View style={styles.container}>
      {showWelcome ? (
        <WelcomeScreen onStart={handleStart} />
      ) : (
        <>
          {/* Header */}
          <Text style={styles.title}>How was your day?</Text>
          <Text style={styles.subtitle}>Write your Thoughts.</Text>

          {/* Entry Preview Box */}
          <Pressable style={styles.entryPreviewBox} onPress={handleWriteEntry}>
            <Text
              style={[
                styles.entryPreviewText,
                { color: '#9ca3af' },
              ]}
            >
              Tap here to write your thoughts...
            </Text>
          </Pressable>

          {/* Error Message */}
          {error && (
            <Text style={styles.errorMessage}>{error}</Text>
          )}

          {/* Entries List */}
          <Text style={styles.sectionTitle}>
            {loading ? 'Loading your entries…' : 'Past entries'}
          </Text>

          <View style={styles.headerRow}>
            <Text style={[styles.headerCell, styles.dateCell]}>Date</Text>
            <Text style={[styles.headerCell, styles.moodCell]}>Mood</Text>
            <Text style={[styles.headerCell, styles.textCell]}>Description</Text>
          </View>

          {entries.length === 0 && !loading && (
            <Text style={styles.emptyText}>
              No entries yet. Your saved journals will appear here.
            </Text>
          )}

          <FlatList
            data={entries}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <EntryItem entry={item} onPress={handleEntrySelect} />
            )}
            contentContainerStyle={{ paddingBottom: 32 }}
          />

          {/* Entry Writer Modal */}
          <EntryWriter
            visible={isWriting}
            onClose={() => setIsWriting(false)}
            onSave={handleSaveEntry}
          />

          {/* Entry Modal (View/Edit) */}
          <EntryModal
            entry={selectedEntry}
            visible={showEntryModal}
            isEditMode={isEditMode}
            onClose={handleCloseModal}
            onEdit={handleEntryEdit}
            onDelete={handleEntryDelete}
            onSaveEdit={handleSaveEdit}
          />
        </>
      )}
    </View>
  );
}

    const styles = StyleSheet.create({
      container: {
        flex: 1,
        paddingHorizontal: 24,
        paddingTop: 80,
        backgroundColor: '#f3f4f6',
      },

      // welcome
      welcomeBox: {
        padding: 20,
        borderRadius: 16,
        marginBottom: 20,
      },
      welcomeTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: '#0f172a',
        marginBottom: 6,
      },
      welcomeText: {
        fontSize: 15,
        color: '#1e293b',
        marginBottom: 12,
      },
      welcomeButton: {
        alignSelf: 'flex-start',
        backgroundColor: '#2563eb',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 999,
      },
      welcomeButtonText: {
        color: '#ffffff',
        fontWeight: '600',
      },

      // main
      title: {
        fontSize: 26,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 4,
      },
      subtitle: {
        fontSize: 15,
        color: '#4b5563',
        marginBottom: 12,
      },
      entryPreviewBox: {
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 12,
        padding: 12,
        backgroundColor: '#ffffff',
        marginBottom: 10,
      },
      entryPreviewText: {
        fontSize: 14,
        color: '#111827',
      },
      moodLabel: {
        fontSize: 14,
        color: '#4b5563',
        marginBottom: 6,
      },
      moodRow: {
        flexDirection: 'row',
        marginBottom: 12,
        gap: 8,
      },
      moodButton: {
        width: 40,
        height: 40,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: '#d1d5db',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#ffffff',
      },
      moodButtonSelected: {
        borderColor: '#2563eb',
        backgroundColor: '#dbeafe',
      },
      moodEmoji: {
        fontSize: 22,
      },
      descriptionInput: {
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 10,
        backgroundColor: '#ffffff',
        color: '#111827',
        marginBottom: 12,
      },
      message: {
        marginTop: 8,
        textAlign: 'center',
        color: 'green',
      },
      errorMessage: {
        marginTop: 8,
        textAlign: 'center',
        color: '#ef4444',
        backgroundColor: '#fef2f2',
        padding: 8,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#fecaca',
      },

      // table
      sectionTitle: {
        marginTop: 20,
        fontSize: 18,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 8,
      },
      emptyText: {
        fontSize: 14,
        color: '#6b7280',
        marginBottom: 8,
      },
      headerRow: {
        flexDirection: 'row',
        paddingVertical: 6,
        borderBottomWidth: 1,
        borderColor: '#e5e7eb',
      },
      headerCell: {
        fontSize: 12,
        fontWeight: '600',
        color: '#6b7280',
      },
      row: {
        flexDirection: 'row',
        paddingVertical: 6,
        borderBottomWidth: 1,
        borderColor: '#e5e7eb',
      },
      cell: {
        fontSize: 13,
        color: '#111827',
      },
      dateCell: {
        width: 70,
      },
      moodCell: {
        width: 50,
        textAlign: 'center',
      },
      textCell: {
        flex: 1,
        paddingLeft: 8,
      },

      // writer / edit modal base
      writeOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.35)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 16,
      },
      writeCard: {
        width: '95%',
        maxHeight: '80%',
        backgroundColor: '#f9fafb',
        borderRadius: 18,
        padding: 16,
      },
      writeHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
      },
      writeTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#111827',
      },
      writeDoneText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#2563eb',
      },
      writeInput: {
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 12,
        padding: 12,
        height: 260,
        backgroundColor: '#ffffff',
        color: '#111827',
        textAlignVertical: 'top',
      },

      // media row inside writer
      mediaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 12,
        gap: 8,
      },
      mediaButton: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 999,
        backgroundColor: '#2563eb',
      },
      mediaButtonText: {
        color: '#ffffff',
        fontSize: 13,
        fontWeight: '600',
      },
      mediaInfo: {
        fontSize: 13,
        color: '#4b5563',
      },

      // view card
      modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.35)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 16,
      },
      modalInner: {
        alignItems: 'center',
        width: '100%',
      },
      bigMood: {
        fontSize: 40,
        marginBottom: 4,
      },
      bigDescription: {
        fontSize: 18,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 12,
      },
      modalCard: {
        width: '90%',
        maxHeight: '70%',
        backgroundColor: '#f9fafb',
        borderRadius: 16,
        padding: 16,
        shadowColor: '#000',
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 5,
      },
      modalHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
        marginBottom: 4,
      },
      modalEditText: {
        fontSize: 14,
        color: '#2563eb',
        fontWeight: '600',
      },
      modalDeleteText: {
        fontSize: 14,
        color: '#ef4444',
        fontWeight: '600',
      },
      modalDate: {
        fontSize: 12,
        color: '#6b7280',
        marginBottom: 8,
      },
      modalContentWrapper: {
        maxHeight: 260,
        marginBottom: 12,
      },
      modalContent: {
        fontSize: 15,
        color: '#111827',
        lineHeight: 22,
      },
      modalCloseButton: {
        alignSelf: 'flex-end',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 999,
        backgroundColor: '#111827',
      },
      modalCloseText: {
        color: '#ffffff',
        fontSize: 13,
      },
    });
