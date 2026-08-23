"use client";

import { useState } from "react";
import {
  Checkbox, CheckboxGroup, Input, Label, ListBox, Radio, RadioGroup, Select, TextField,
} from "@heroui/react";
import { Flag } from "@/components/ds";
import { Emoji } from "./Emoji";
import type { EmojiName } from "@/lib/onboarding/emoji";
import { sanitize } from "@/lib/onboarding/profileState";
import { titleCase } from "@/lib/text";
import { useIsPhone } from "@/lib/useIsPhone";
import type { Choice, Control } from "@/lib/onboarding/journey";
import { useT } from "@/lib/onboarding/lang";

/* The answer area of a question screen. One control per question, all of them
   built on HeroUI v3 primitives so keyboard navigation, focus rings and the
   screen-reader wiring come from React Aria rather than being re-invented:

     choice   selectable rows, single choice     (RadioGroup)
     multi    selectable rows, several choices   (CheckboxGroup)
     select   dropdown, for long option lists    (Select)
     text     one line                           (TextField)
     date     one date                           (TextField, native date input)
     phone    country code + number              (two TextFields)

   A row is: [emoji] [name] … [trailing label]. Selection is a brand border and
   a pale wash — never a filled row, which at 52px shouts. */

/* Signal-strength meter: bars of rising height, lit up to the option's rank. */
function Meter({ lit, total }: { lit: number; total: number }) {
  return (
    <span className="onb-meter" aria-hidden>
      {Array.from({ length: total }, (_, i) => (
        <i key={i} data-on={i < lit || undefined} style={{ height: `${34 + (i / Math.max(1, total - 1)) * 66}%` }} />
      ))}
    </span>
  );
}

function Row({ choice, selected, showTick }: { choice: Choice; selected: boolean; showTick?: boolean }) {
  /* The flag carries the whole answer on the destination question, and at the
     desktop `md` it was a 24px chip on a 62px phone row. `lg` is the design
     system's own next step up (42x30), so this reaches for a defined size
     rather than scaling one. Flag styles its box inline, which is why this is
     a prop and not a media query. */
  const phone = useIsPhone();
  /* Applied to every choice without a list of exceptions: the names that must
     not change language — countries, degrees, fields, test names, English
     levels — are simply absent from the Darija map, so they pass through this
     untouched. Nothing has to be kept in sync. */
  const t = useT();
  return (
    <>
      {choice.flag
        ? <Flag stripes={choice.flag} size={phone ? "lg" : "md"} unavailable={choice.disabled} selected={selected} style={{ flex: "none" }} />
        : choice.bars
          ? <Meter lit={choice.bars.lit} total={choice.bars.total} />
          : choice.emoji && <Emoji name={choice.emoji} size={22} className="onb-opt-emoji" />}
      <span className="onb-opt-text">
        <span className="onb-opt-label">{t(choice.label)}</span>
        {choice.sub && <span className="onb-opt-sub">{t(choice.sub)}</span>}
      </span>
      {choice.hint ? (
        <span className="onb-opt-side">{t(choice.hint)}</span>
      ) : showTick && selected ? (
        <span className="onb-opt-side onb-opt-tick" aria-hidden>
          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M4.5 10.5 8.5 14.5 15.5 6" /></svg>
        </span>
      ) : null}
    </>
  );
}

function ChoiceRows({ control, value, label, onChange }: { control: Extract<Control, { kind: "choice" }>; value: string; label: string; onChange: (v: string) => void }) {
  const t = useT();
  return (
    <RadioGroup className="onb-opts" data-cols={control.columns} data-compact={control.compact || undefined} data-phone-cols={control.phoneColumns} aria-label={t(label)} value={value} onChange={onChange}>
      {control.choices.map((c) => (
        <Radio key={c.value} className="onb-opt" value={c.value} isDisabled={c.disabled}>
          {({ isSelected }) => (
            <Radio.Content className="onb-opt-in" data-on={isSelected || undefined}>
              <Row choice={c} selected={isSelected} />
            </Radio.Content>
          )}
        </Radio>
      ))}
    </RadioGroup>
  );
}

function MultiRows({ control, value, label, onChange }: { control: Extract<Control, { kind: "multi" }>; value: string; label: string; onChange: (v: string) => void }) {
  const t = useT();
  const chosen = value ? value.split("|").filter(Boolean) : [];
  const full = chosen.length >= control.max;
  return (
    <CheckboxGroup
      className="onb-opts" data-cols={control.columns} aria-label={t(label)}
      value={chosen}
      onChange={(next) => onChange((next as string[]).join("|"))}
    >
      {control.choices.map((c) => {
        const on = chosen.includes(c.value);
        return (
          <Checkbox key={c.value} className="onb-opt" value={c.value} isDisabled={c.disabled || (full && !on)}>
            {({ isSelected }) => (
              <Checkbox.Content className="onb-opt-in" data-on={isSelected || undefined}>
                <Row choice={c} selected={isSelected} showTick />
              </Checkbox.Content>
            )}
          </Checkbox>
        );
      })}
    </CheckboxGroup>
  );
}

function Dropdown({ control, value, label, emoji, onChange }: { control: Extract<Control, { kind: "select" }>; value: string; label: string; emoji?: EmojiName; onChange: (v: string) => void }) {
  const t = useT();
  return (
    <Select
      className="onb-select" aria-label={t(label)} placeholder={t(control.placeholder)}
      value={value || null}
      onChange={(v) => onChange(v == null ? "" : String(v))}
    >
      <Select.Trigger className="onb-select-trigger">
        {emoji && <Emoji name={emoji} size={22} className="onb-input-emoji" />}
        <Select.Value />
        <Select.Indicator />
      </Select.Trigger>
      <Select.Popover className="onb-select-popover">
        <ListBox>
          {control.choices.map((c) => (
            <ListBox.Item key={c.value} id={c.value} textValue={c.label}>
              {c.label}
              <ListBox.ItemIndicator />
            </ListBox.Item>
          ))}
        </ListBox>
      </Select.Popover>
    </Select>
  );
}

/* `phone` is not handled here: it writes two columns, so the page renders
   PhoneAnswer directly for it. */
export function Answer({
  control, value, label, emoji, invalid, autoFocus = true, onChange, onCommit, onEnter,
}: {
  control: Exclude<Control, { kind: "phone" }>;
  value: string;
  label: string;
  emoji?: EmojiName;
  invalid?: boolean;
  /* A follow-up revealed by the answer above it passes false. Grabbing focus
     the instant it appears is what made choosing an English test feel like it
     had opened the next question by itself. */
  autoFocus?: boolean;
  onChange: (v: string) => void;
  onCommit: () => void;
  onEnter: () => void;
}) {
  const enterKey = (e: React.KeyboardEvent) => { if (e.key === "Enter") { e.preventDefault(); onCommit(); onEnter(); } };
  const phone = useIsPhone();
  const t = useT();

  /* Focus WITHOUT summoning the keyboard, on the phone only.

     A readonly field can hold focus on iOS and Android without the OS opening
     the keyboard, so the question arrives visibly ready to answer while the
     student still gets to read it and decide when to type. The attribute is
     dropped the moment they actually reach for the field, so the very first
     tap types normally.

     Phone only: on a desktop there is no keyboard to avoid, and readonly there
     would swallow the first keystroke of someone who just starts typing. */
  const [released, setReleased] = useState(false);
  const softLocked = phone && autoFocus && !released;
  const release = () => setReleased(true);
  const softProps = softLocked
    ? { readOnly: true, onPointerDown: release, onTouchStart: release, onKeyDown: release }
    : {};

  if (control.kind === "choice") return <ChoiceRows control={control} value={value} label={label} onChange={(v) => { onChange(v); onCommit(); }} />;
  if (control.kind === "multi") return <MultiRows control={control} value={value} label={label} onChange={(v) => { onChange(v); onCommit(); }} />;
  if (control.kind === "select") return <Dropdown control={control} value={value} label={label} emoji={emoji} onChange={(v) => { onChange(v); onCommit(); }} />;

  if (control.kind === "date") {
    return (
      <div className="onb-inputbox" data-invalid={invalid || undefined}>
        {emoji && <Emoji name={emoji} size={22} className="onb-input-emoji" />}
        <TextField className="onb-field" aria-label={t(label)} type="date" value={value} onChange={onChange} isInvalid={invalid}>
          <Input className="onb-input" onBlur={onCommit} onKeyDown={enterKey} autoFocus={autoFocus && !phone} />
        </TextField>
      </div>
    );
  }

  /* Two fields, one stored string. `full_name` is a single column shared with
     the classic wizard, so the split is presentational: the halves are read
     back out of the stored value and written back as one. Splitting on the
     FIRST space keeps a multi-part surname ("El Amrani") intact in the second
     field instead of dropping everything after the second word. */
  if (control.kind === "name") {
    const trimmed = value.trim();
    const cut = trimmed.indexOf(" ");
    const first = cut === -1 ? trimmed : trimmed.slice(0, cut);
    const last = cut === -1 ? "" : trimmed.slice(cut + 1).trim();
    const compose = (f: string, l: string) => `${f.trim()} ${l.trim()}`.trim();

    return (
      <div className="onb-namepair">
        <div className="onb-inputbox" data-invalid={(invalid && !first) || undefined}>
          <Emoji name="id" size={22} className="onb-input-emoji" />
          <TextField className="onb-field" aria-label={t("First name")} value={first}
            onChange={(v) => onChange(compose(titleCase(v), last))}>
            <Input className="onb-input" placeholder={t("First name")} onBlur={onCommit} onKeyDown={enterKey}
              autoFocus={autoFocus} {...softProps} />
          </TextField>
        </div>
        <div className="onb-inputbox" data-invalid={(invalid && !last) || undefined}>
          {/* Its own mark, so the two rows read as two answers rather than one
              control that happens to have wrapped. */}
          <Emoji name="scroll" size={22} className="onb-input-emoji" />
          <TextField className="onb-field" aria-label={t("Last name")} value={last}
            onChange={(v) => onChange(compose(first, titleCase(v)))}>
            <Input className="onb-input" placeholder={t("Last name")} onBlur={onCommit} onKeyDown={enterKey} />
          </TextField>
        </div>
      </div>
    );
  }

  return (
    <div className="onb-inputbox" data-invalid={invalid || undefined}>
      {emoji && <Emoji name={emoji} size={22} className="onb-input-emoji" />}
      <TextField className="onb-field" aria-label={t(label)} value={value} isInvalid={invalid}
        onChange={(v) => onChange(sanitize(control, v))}>
        <Input
          className="onb-input" placeholder={t(control.placeholder)} inputMode={control.inputMode}
          maxLength={control.maxLength} onBlur={onCommit} onKeyDown={enterKey}
          autoFocus={autoFocus} {...softProps}
        />
      </TextField>
    </div>
  );
}

/* WhatsApp: one control, two stored columns. The code and the number are drawn
   as a single bordered row with a hairline between them — two separate boxes
   read as two questions, which this is not. The code stays free text rather
   than a fixed list, so a student outside Morocco can still be reached. */
export function PhoneAnswer({
  code, number, emoji, invalid, onCode, onNumber, onCommit, onEnter,
}: {
  code: string; number: string; emoji?: EmojiName; invalid?: boolean;
  onCode: (v: string) => void; onNumber: (v: string) => void; onCommit: () => void; onEnter: () => void;
}) {
  const enterKey = (e: React.KeyboardEvent) => { if (e.key === "Enter") { e.preventDefault(); onCommit(); onEnter(); } };
  const t = useT();
  /* The phone control is marked unchanged in the translation review: the dial
     code, the digits and the spacing of the placeholder are the same in both
     languages, so only the screen-reader labels move. */
  return (
    <div className="onb-inputbox onb-phone" data-invalid={invalid || undefined}>
      {emoji && <Emoji name={emoji} size={22} className="onb-input-emoji" />}
      <TextField className="onb-phone-code" value={code} onChange={(v) => onCode(v.replace(/[^\d+]/g, "").slice(0, 5))}>
          <Label className="onb-sr">{t("Country dialling code")}</Label>
        <Input className="onb-phone-input" inputMode="tel" onBlur={onCommit} onKeyDown={enterKey} />
      </TextField>
      <span className="onb-phone-split" aria-hidden />
      <TextField className="onb-phone-number" value={number} isInvalid={invalid} onChange={(v) => onNumber(v.replace(/[^\d]/g, "").slice(0, 15))}>
        <Label className="onb-sr">{t("WhatsApp number")}</Label>
        <Input className="onb-phone-input" placeholder="6 12 34 56 78" inputMode="numeric" onBlur={onCommit} onKeyDown={enterKey} autoFocus />
      </TextField>
    </div>
  );
}
