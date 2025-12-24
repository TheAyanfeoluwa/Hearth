import React from 'react';
import { View, StyleSheet, Image } from 'react-native';
import Colors from '@/constants/Colors';

// Placeholder for a Lottie animation of a fireplace
export function Campfire() {
    return (
        <View style={styles.container}>
            <View style={styles.fireContainer}>
                {/* In a real implementation, this would be <LottieView source={require('@/assets/lottie/fire.json')} autoPlay loop /> */}
                <View style={styles.flameOuter}>
                    <View style={styles.flameInner} />
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
        height: 300,
        width: 300,
    },
    fireContainer: {
        width: 150,
        height: 150,
        justifyContent: 'flex-end',
        alignItems: 'center',
    },
    flameOuter: {
        width: 100,
        height: 120,
        backgroundColor: Colors.cozy.flame,
        borderRadius: 50,
        borderTopRightRadius: 0,
        transform: [{ rotate: '45deg' }],
        justifyContent: 'center',
        alignItems: 'center',
        opacity: 0.8,
    },
    flameInner: {
        width: 60,
        height: 80,
        backgroundColor: 'yellow',
        borderRadius: 30,
        borderTopRightRadius: 0,
        opacity: 0.8,
    }
});
