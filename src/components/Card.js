/**
 * Small layout primitives shared across screens:
 * - Card:        bordered/elevated container
 * - CardHeader:  title + optional right-aligned link
 * - SectionHead: between cards on a page
 * - Empty:       centered empty-state placeholder
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, fonts, radius, spacing } from '../theme/tokens';

export function Card({ children, style }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function CardHeader({ title, rightLabel, onRightPress }) {
  return (
    <View style={styles.cardHeader}>
      <Text style={styles.cardTitle}>{title}</Text>
      {rightLabel != null &&
        (onRightPress ? (
          <TouchableOpacity onPress={onRightPress}>
            <Text style={styles.cardLink}>{rightLabel}</Text>
          </TouchableOpacity>
        ) : (
          <Text style={styles.cardLink}>{rightLabel}</Text>
        ))}
    </View>
  );
}

export function SectionHead({ title, rightLabel, onRightPress }) {
  return (
    <View style={styles.sectionHead}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {rightLabel != null && (
        <TouchableOpacity onPress={onRightPress}>
          <Text style={styles.sectionLink}>{rightLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

export function Empty({ icon, title, text }) {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyIcon}>{icon}</Text>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bgElev,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    padding: 18,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  cardTitle: {
    fontFamily: fonts.display,
    fontWeight: '500',
    fontSize: 17,
    color: colors.text,
  },
  cardLink: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textDim,
  },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginVertical: 12,
    marginTop: 22,
    paddingHorizontal: spacing.xs,
  },
  sectionTitle: {
    fontFamily: fonts.display,
    fontWeight: '500',
    fontSize: 18,
    color: colors.text,
  },
  sectionLink: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textDim,
  },
  empty: {
    paddingVertical: 40,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 32,
    opacity: 0.4,
    marginBottom: 12,
  },
  emptyTitle: {
    fontFamily: fonts.display,
    fontSize: 18,
    color: colors.text,
    marginBottom: 4,
  },
  emptyText: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textDim,
    textAlign: 'center',
  },
});
