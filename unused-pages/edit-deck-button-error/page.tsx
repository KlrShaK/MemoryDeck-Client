// const handleDeleteDeck = async () => {
    // confirm({
    //   title: (
    //     <span style={{ color: 'black' }}>
    //       Delete this deck?
    //     </span>
    //   ),
    //   icon: <ExclamationCircleOutlined />,
    //   content: (
    //     <span style={{ color: 'black' }}>
    //       All flashcards will be removed. This action is irreversible.
    //     </span>
    //   ),
    //   okText: 'Delete',
    //   okType: 'danger',
    //   cancelText: 'Cancel',
    //   onOk: async () => {
    //     try {
    //       if (!deckId) {
    //         showError("Deck ID is missing.");
    //         return;
    //       }

    //       await apiService.delete(`/decks/${deckId}`);
    //       showSuccess('Deck deleted');
    //       router.push('/decks');
    //     } catch (error) {
    //       console.error('Delete deck failed:', error);
    //       showError('Failed to delete deck');
    //     }
    //   },
    // });
//   };